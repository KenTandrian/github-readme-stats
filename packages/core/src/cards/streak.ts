import { getLightDarkColors } from "../common/color.js";
import type { StreakData } from "../fetchers/types.js";

import type { CommonOptions } from "./types.js";

interface StreakCardOptions extends CommonOptions {
  hide_total_contributions?: boolean;
  hide_current_streak?: boolean;
  hide_longest_streak?: boolean;
}

const CARD_DEFAULT_WIDTH = 495;
const CARD_DEFAULT_HEIGHT = 195;

/**
 * Format date range helper.
 */
const formatRange = (start?: string, end?: string): string => {
  if (!start || !end) {
    return "";
  }
  if (start === end) {
    return start;
  }
  return `${start} - ${end}`;
};

/**
 * Render GitHub Streak card with glowing fire ring design.
 *
 * @param streakData Streak data.
 * @param options Streak card options.
 * @returns SVG string of streak card.
 */
const renderStreakCard = (
  streakData: StreakData,
  options: Partial<StreakCardOptions> = {},
): string => {
  const {
    currentStreak,
    longestStreak,
    totalContributions,
    firstContribution,
    currentStreakStart,
    currentStreakEnd,
    longestStreakStart,
    longestStreakEnd,
  } = streakData;

  const {
    theme = "default",
    border_radius = 4.5,
    hide_border = false,
    hide_total_contributions = false,
    hide_current_streak = false,
    hide_longest_streak = false,
  } = options;

  const { lightColors, darkColors } = getLightDarkColors({ ...options, theme });
  const { textColor, iconColor, borderColor, bgColor } = lightColors;

  const statsY = 85;
  const labelsY = 115;
  const rangeY = 135;
  const circleY = 79;
  const circleNumberY = 84;
  const circleLabelY = 144;
  const circleRangeY = 164;
  const fireIconY = 23.5;

  const lineTop = 30;
  const lineBottom = 165;
  const line1X = 171;
  const line2X = 324;

  const ringColor = iconColor || "orange";
  const strokeColor = hide_border ? "none" : borderColor;

  const lightStyle = `
    @keyframes fadein {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes glowPulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    @keyframes currstreak {
      0% { font-size: 3px; opacity: 0.2; }
      80% { font-size: 34px; opacity: 1; }
      100% { font-size: 28px; opacity: 1; }
    }
    .stat { font: 700 28px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; text-anchor: middle; animation: fadein 0.6s forwards; }
    .label { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; text-anchor: middle; opacity: 0; animation: fadein 0.8s forwards; }
    .range { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; text-anchor: middle; opacity: 0; animation: fadein 1s forwards; }
    .circle-label { font: 700 28px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${ringColor}; text-anchor: middle; dominant-baseline: middle; filter: url(#glow); animation: currstreak 0.6s forwards; }
    .ring { stroke: ${ringColor}; filter: url(#glow); animation: glowPulse 2s infinite; }
    .divider { stroke: ${textColor}; stroke-opacity: 0.4; stroke-width: 1; }
  `;

  const darkStyle = darkColors
    ? `
    @media (prefers-color-scheme: dark) {
      .card-bg { fill: ${darkColors.bgColor as string}; stroke: ${darkColors.borderColor}; }
      .stat { fill: ${darkColors.textColor}; }
      .label { fill: ${darkColors.textColor}; }
      .range { fill: ${darkColors.textColor}; }
      .circle-label { fill: ${darkColors.iconColor || ringColor}; }
      .ring { stroke: ${darkColors.iconColor || ringColor}; }
      .divider { stroke: ${darkColors.textColor}; }
    }
  `
    : "";

  const totalCol = hide_total_contributions
    ? ""
    : `<g transform="translate(0, 0)">
        <text x="95" y="${statsY}" class="stat">${totalContributions.toLocaleString()}</text>
        <text x="95" y="${labelsY}" class="label">Total Contributions</text>
        <text x="95" y="${rangeY}" class="range">${
          firstContribution ? `${firstContribution} - Present` : ""
        }</text>
      </g>`;

  const currentCol = hide_current_streak
    ? ""
    : `<g transform="translate(0, 0)">
        <g mask="url(#mask_out_ring_behind_fire)">
          <circle cx="247.5" cy="${circleY}" r="40" stroke-width="5" class="ring" fill="none"/>
        </g>
        
        <g transform="translate(247.5, ${fireIconY})" style="opacity: 0; animation: fadein 0.5s linear forwards 0.6s">
          <path d="M -12 -0.5 L 15 -0.5 L 15 23.5 L -12 23.5 Z" fill="none"/>
          <path d="M 1.5 0.67 C 1.5 0.67 2.24 3.32 2.24 5.47 C 2.24 7.53 0.89 9.2 -1.17 9.2 C -3.23 9.2 -4.79 7.53 -4.79 5.47 L -4.76 5.11 C -6.78 7.51 -8 10.62 -8 13.99 C -8 18.41 -4.42 22 0 22 C 4.42 22 8 18.41 8 13.99 C 8 8.6 5.41 3.79 1.5 0.67 Z M -0.29 19 C -2.07 19 -3.51 17.6 -3.51 15.86 C -3.51 14.24 -2.46 13.1 -0.7 12.74 C 1.07 12.38 2.9 11.53 3.92 10.16 C 4.31 11.45 4.51 12.81 4.51 14.2 C 4.51 16.85 2.36 19 -0.29 19 Z" 
            fill="${ringColor}" filter="url(#glow)"/>
        </g>

        <text x="247.5" y="${circleNumberY}" class="circle-label">${currentStreak}</text>
        <text x="247.5" y="${circleLabelY}" class="label" style="fill: ${ringColor}">Current Streak</text>
        <text x="247.5" y="${circleRangeY}" class="range">${formatRange(
          currentStreakStart,
          currentStreakEnd,
        )}</text>
      </g>`;

  const longestCol = hide_longest_streak
    ? ""
    : `<g transform="translate(0, 0)">
        <text x="400" y="${statsY}" class="stat">${longestStreak}</text>
        <text x="400" y="${labelsY}" class="label">Longest Streak</text>
        <text x="400" y="${rangeY}" class="range">${formatRange(
          longestStreakStart,
          longestStreakEnd,
        )}</text>
      </g>`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD_DEFAULT_WIDTH}" height="${CARD_DEFAULT_HEIGHT}" viewBox="0 0 ${CARD_DEFAULT_WIDTH} ${CARD_DEFAULT_HEIGHT}">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <mask id="mask_out_ring_behind_fire">
          <rect width="${CARD_DEFAULT_WIDTH}" height="${CARD_DEFAULT_HEIGHT}" fill="white"/>
          <ellipse cx="247.5" cy="${fireIconY + 12.5}" rx="13" ry="18" fill="black"/>
        </mask>
      </defs>
      <style>
        ${lightStyle}
        ${darkStyle}
      </style>
      
      <rect class="card-bg" width="100%" height="100%" fill="${bgColor as string}" stroke="${strokeColor}" rx="${border_radius}"/>
      
      <!-- Divider lines -->
      <line x1="${line1X}" y1="${lineTop}" x2="${line1X}" y2="${lineBottom}" class="divider" />
      <line x1="${line2X}" y1="${lineTop}" x2="${line2X}" y2="${lineBottom}" class="divider" />

      ${totalCol}
      ${currentCol}
      ${longestCol}
    </svg>
  `;
};

export { renderStreakCard };
