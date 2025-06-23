export * from "./common/index.js";
export * from "./cards/index.js";
import { renderStatsCard } from 'github-readme-stats'

// 必须导出包含事件处理方法的对象
export default {
  // 处理 HTTP 请求
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const username = url.searchParams.get('username') || 'torvalds';
      
      const card = await renderStatsCard(username, {
        theme: url.searchParams.get('theme') || 'dark',
        hide_border: true
      });
      
      return new Response(card, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
  
  // 可选的定时任务处理
  async scheduled(event, env, ctx) {
    // 定时任务逻辑
  }
}
