import { renderStreakCard } from "../cards/streak.js";
import { findInvalidColorParam, pickColorParams } from "../common/color.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../common/error.js";
import { parseBoolean } from "../common/ops.js";
import { renderError } from "../common/render.js";
import { fetchStreak } from "../fetchers/streak.js";
import { isLocaleAvailable } from "../translations.js";

// @ts-ignore
export default async (
  {
    username,
    locale,
    border_radius,
    hide_border,
    custom_title,
    hide_total_contributions,
    hide_current_streak,
    hide_longest_streak,
    ...remainingParams
  },
  pat = null,
) => {
  const colorParams = pickColorParams(remainingParams);

  const invalidColorInput = findInvalidColorParam(colorParams);
  if (invalidColorInput) {
    return {
      status: "error - permanent",
      content: renderError({
        message: "Something went wrong",
        secondaryMessage: `Invalid color input for parameter "${invalidColorInput}"`,
      }),
    };
  }

  if (locale && !isLocaleAvailable(locale)) {
    return {
      status: "error - permanent",
      content: renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
        renderOptions: colorParams,
      }),
    };
  }

  const safePattern = /^[-\w/.,]+$/;
  if (username && !safePattern.test(username)) {
    return {
      status: "error - permanent",
      content: renderError({
        message: "Something went wrong",
        secondaryMessage: "Username contains unsafe characters",
        renderOptions: colorParams,
      }),
    };
  }

  try {
    const streakData = await fetchStreak(username, pat);

    return {
      status: "success",
      content: renderStreakCard(streakData, {
        ...colorParams,
        border_radius,
        custom_title,
        locale: locale ? locale.toLowerCase() : null,
        hide_border: parseBoolean(hide_border),
        hide_total_contributions: parseBoolean(hide_total_contributions),
        hide_current_streak: parseBoolean(hide_current_streak),
        hide_longest_streak: parseBoolean(hide_longest_streak),
      }),
    };
  } catch (err) {
    if (err instanceof Error) {
      return {
        status: "error - temporary",
        content: renderError({
          message: err.message,
          secondaryMessage: retrieveSecondaryMessage(err),
          renderOptions: {
            ...colorParams,
            show_repo_link: !(err instanceof MissingParamError),
          },
        }),
      };
    }
    return {
      status: "error - temporary",
      content: renderError({
        message: "An unknown error occurred",
        renderOptions: colorParams,
      }),
    };
  }
};
