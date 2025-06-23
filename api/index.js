import { renderStatsCard } from "../src/cards/stats-card.js";
import { blacklist } from "../src/common/blacklist.js";
import {
  clampValue,
  CONSTANTS,
  parseArray,
  parseBoolean,
  renderError,
} from "../src/common/utils.js";
import { fetchStats } from "../src/fetchers/stats-fetcher.js";
import { isLocaleAvailable } from "../src/translations.js";

// 必须导出包含 fetch 方法的对象
export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const params = Object.fromEntries(url.searchParams);
      
      const {
        username,
        hide,
        hide_title,
        hide_border,
        card_width,
        hide_rank,
        show_icons,
        include_all_commits,
        line_height,
        title_color,
        ring_color,
        icon_color,
        text_color,
        text_bold,
        bg_color,
        theme,
        cache_seconds,
        exclude_repo,
        custom_title,
        locale,
        disable_animations,
        border_radius,
        number_format,
        border_color,
        rank_icon,
        show,
      } = params;

      // 设置响应头
      const headers = new Headers({
        "Content-Type": "image/svg+xml"
      });

      // 黑名单检查
      if (blacklist.includes(username)) {
        const errorSvg = renderError("Something went wrong", "This username is blacklisted", {
          title_color,
          text_color,
          bg_color,
          border_color,
          theme,
        });
        return new Response(errorSvg, { headers });
      }

      // 语言检查
      if (locale && !isLocaleAvailable(locale)) {
        const errorSvg = renderError("Something went wrong", "Language not found", {
          title_color,
          text_color,
          bg_color,
          border_color,
          theme,
        });
        return new Response(errorSvg, { headers });
      }

      // 获取统计数据
      const showStats = parseArray(show);
      const stats = await fetchStats(
        username,
        parseBoolean(include_all_commits),
        parseArray(exclude_repo),
        showStats.includes("prs_merged") ||
          showStats.includes("prs_merged_percentage"),
        showStats.includes("discussions_started"),
        showStats.includes("discussions_answered"),
      );

      // 缓存设置
      let cacheSeconds = clampValue(
        parseInt(cache_seconds || CONSTANTS.CARD_CACHE_SECONDS, 10),
        CONSTANTS.TWELVE_HOURS,
        CONSTANTS.TWO_DAY,
      );
      
      cacheSeconds = process.env.CACHE_SECONDS
        ? parseInt(process.env.CACHE_SECONDS, 10) || cacheSeconds
        : cacheSeconds;

      headers.set(
        "Cache-Control",
        `max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=${CONSTANTS.ONE_DAY}`
      );

      // 渲染卡片
      const svg = renderStatsCard(stats, {
        hide: parseArray(hide),
        show_icons: parseBoolean(show_icons),
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        hide_rank: parseBoolean(hide_rank),
        include_all_commits: parseBoolean(include_all_commits),
        line_height,
        title_color,
        ring_color,
        icon_color,
        text_color,
        text_bold: parseBoolean(text_bold),
        bg_color,
        theme,
        custom_title,
        border_radius,
        border_color,
        number_format,
        locale: locale ? locale.toLowerCase() : null,
        disable_animations: parseBoolean(disable_animations),
        rank_icon,
        show: showStats,
      });

      return new Response(svg, { headers });

    } catch (err) {
      // 错误处理
      const headers = new Headers({
        "Content-Type": "image/svg+xml",
        "Cache-Control": `max-age=${CONSTANTS.ERROR_CACHE_SECONDS / 2}, s-maxage=${
          CONSTANTS.ERROR_CACHE_SECONDS
        }, stale-while-revalidate=${CONSTANTS.ONE_DAY}`
      });
      
      const errorSvg = renderError(err.message, err.secondaryMessage || "", {
        title_color: params.title_color,
        text_color: params.text_color,
        bg_color: params.bg_color,
        border_color: params.border_color,
        theme: params.theme,
      });
      
      return new Response(errorSvg, { headers, status: 500 });
    }
  }
};
