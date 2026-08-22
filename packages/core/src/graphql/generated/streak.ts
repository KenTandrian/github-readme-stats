// Generated file — see .github/CONTRIBUTING.md

/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
import { graphqlDocument } from "../graphqlDocument.js";
export type StreakYearsQueryVariables = Exact<{
  login: string;
}>;

export type StreakYearsQuery = {
  user: {
    contributionsCollection: { contributionYears: Array<number> };
  } | null;
};

export type StreakYearCalendarQueryVariables = Exact<{
  login: string;
  from: string;
  to: string;
}>;

export type StreakYearCalendarQuery = {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: Array<{
          contributionDays: Array<{ date: unknown; contributionCount: number }>;
        }>;
      };
    };
  } | null;
};

export const StreakYearsDocument = graphqlDocument<
  StreakYearsQuery,
  StreakYearsQueryVariables
>(`
query streakYears($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionYears
    }
  }
}`);

export const StreakYearCalendarDocument = graphqlDocument<
  StreakYearCalendarQuery,
  StreakYearCalendarQueryVariables
>(`
query streakYearCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`);
