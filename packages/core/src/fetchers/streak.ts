import { MissingParamError } from "../common/error.js";
import { createGraphQLFetcher } from "../common/http.js";
import { retryer } from "../common/retryer.js";
import {
  StreakYearCalendarDocument,
  StreakYearsDocument,
} from "../graphql/generated/streak.js";

import type { StreakData } from "./types.js";

const yearsFetcher = createGraphQLFetcher(StreakYearsDocument, "token");
const calendarFetcher = createGraphQLFetcher(
  StreakYearCalendarDocument,
  "token",
);

/**
 * Format a date for display (YYYY-MM-DD to MMM D or MMM D, YYYY)
 * @param dateString ISO date string
 * @param includeYear Whether to include the year
 */
function formatDateForDisplay(
  dateString: string | null,
  includeYear = false,
): string {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);

  if (includeYear) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Calculate streaks and totals from all days (GitHub logic, UTC aware).
 * @param contributions Map of date string to count
 */
function calculateStreaks(contributions: Record<string, number>): StreakData {
  const dates = Object.keys(contributions).sort();
  let totalContributions = 0;
  let longestStreak = 0;

  let currentStreakStart: string | null = null;

  let currentStreakEnd: string | null = null;
  let longestStreakStart: string | null = null;
  let longestStreakEnd: string | null = null;

  let firstContribution: string | null = null;
  for (const date of dates) {
    const count = contributions[date] ?? 0;
    if (count > 0) {
      firstContribution = date;
      break;
    }
  }

  const now = new Date();
  const isoString = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
  const today = isoString.split("T")[0] ?? "";

  for (const date of dates) {
    totalContributions += contributions[date] ?? 0;
  }

  let currentStreak = 0;
  let streaking = true;
  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i];
    if (!date) {
      continue;
    }
    const count = contributions[date] ?? 0;

    if (date > today) {
      continue;
    }

    if (streaking) {
      if (count > 0) {
        currentStreak++;
        if (currentStreakEnd === null) {
          currentStreakEnd = date;
        }
        currentStreakStart = date;
      } else {
        if (date === today || date < today) {
          streaking = false;
        }
      }
    }
  }

  let tempStreak = 0;
  let prevDate: string | null = null;
  let tempStreakStart: string | null = null;

  for (const date of dates) {
    const count = contributions[date] ?? 0;

    if (count > 0) {
      if (
        prevDate === null ||
        (new Date(date).getTime() - new Date(prevDate).getTime()) /
          (1000 * 60 * 60 * 24) ===
          1
      ) {
        if (tempStreak === 0) {
          tempStreakStart = date;
        }
        tempStreak++;
      } else {
        tempStreak = 1;
        tempStreakStart = date;
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakStart = tempStreakStart;
        longestStreakEnd = date;
      }
    } else {
      tempStreak = 0;
    }
    prevDate = date;
  }

  return {
    currentStreak,
    longestStreak,
    totalContributions,
    firstContribution: formatDateForDisplay(firstContribution, true),
    currentStreakStart: formatDateForDisplay(currentStreakStart),
    currentStreakEnd: formatDateForDisplay(currentStreakEnd),
    longestStreakStart: formatDateForDisplay(longestStreakStart),
    longestStreakEnd: formatDateForDisplay(longestStreakEnd),
  };
}

/**
 * Fetch GitHub user streak data.
 *
 * @param username GitHub username.
 * @param pat Optional PAT override.
 * @returns Streak data.
 */
const fetchStreak = async (
  username: string,
  pat: string | null = null,
): Promise<StreakData> => {
  if (!username) {
    throw new MissingParamError(["username"], "/api/streak?username=USERNAME");
  }

  const yearsRes = await retryer(yearsFetcher, { login: username }, pat);
  if (yearsRes.data.errors) {
    throw new Error(yearsRes.data.errors[0]?.message);
  }

  const user = yearsRes.data.data.user;
  if (!user) {
    throw new Error("Could not fetch user.");
  }

  const years = user.contributionsCollection.contributionYears;
  const contributions: Record<string, number> = {};

  for (const year of years) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const calRes = await retryer(
      calendarFetcher,
      { login: username, from, to },
      pat,
    );
    if (calRes.data.errors) {
      throw new Error(calRes.data.errors[0]?.message);
    }

    const calendarUser = calRes.data.data.user;
    if (calendarUser) {
      const weeks =
        calendarUser.contributionsCollection.contributionCalendar.weeks;
      for (const week of weeks) {
        for (const day of week.contributionDays) {
          contributions[day.date as string] = day.contributionCount;
        }
      }
    }
  }

  return calculateStreaks(contributions);
};

export { fetchStreak, calculateStreaks, formatDateForDisplay };
