/**
 * Open Music - API Module
 * TuneHub API 封装层
 */

const API = {
  BASE_URL: 'https://music-dl.sayqz.com',
  
  // 支持的平台
  PLATFORMS: {
    NETEASE: 'netease',
    KUWO: 'kuwo',
    QQ: 'qq'
  },
  
  // 音质选项
  QUALITY: {
    STANDARD: '128k',
    HIGH: '320k',
    LOSSLESS: 'flac',
    HIRES: 'flac24bit'
  },
  
  /**
   * 构建 API URL
   */
  buildUrl(params) {
    const url = new URL('/api/', this.BASE_URL);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    return url.toString();
  },
  
  /**
   * 发送 API 请求
   */
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      // 检查是否是重定向（用于 url/pic/lrc 类型）
      if (response.redirected) {
        return { redirected: true, url: response.url };
      }
      
      // 检查是否是文本响应（用于歌词）
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/plain')) {
        const text = await response.text();
        return { data: text, isText: true };
      }
      
      // JSON 响应
      const data = await response.json();
      
      if (data.code === 200) {
        return data;
      } else {
        throw new Error(data.message || 'API request failed');
      }
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  },
  
  /**
   * 聚合搜索
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Object>} 搜索结果
   */
  async aggregateSearch(keyword) {
    const url = this.buildUrl({
      type: 'aggregateSearch',
      keyword: keyword
    });
    return await this.request(url);
  },
  
  /**
   * 单平台搜索
   * @param {string} source - 平台标识
   * @param {string} keyword - 搜索关键词
   * @param {number} limit - 结果数量限制
   * @returns {Promise<Object>} 搜索结果
   */
  async search(source, keyword, limit = 20) {
    const url = this.buildUrl({
      source: source,
      type: 'search',
      keyword: keyword,
      limit: limit
    });
    return await this.request(url);
  },
  
  /**
   * 获取歌曲信息
   * @param {string} source - 平台标识
   * @param {string} id - 歌曲 ID
   * @returns {Promise<Object>} 歌曲信息
   */
  async getSongInfo(source, id) {
    const url = this.buildUrl({
      source: source,
      id: id,
      type: 'info'
    });
    return await this.request(url);
  },
  
  /**
   * 获取音乐文件 URL
   * @param {string} source - 平台标识
   * @param {string} id - 歌曲 ID
   * @param {string} quality - 音质 (128k/320k/flac/flac24bit)
   * @returns {string} 音乐文件 URL
   */
  getSongUrl(source, id, quality = this.QUALITY.HIGH) {
    return this.buildUrl({
      source: source,
      id: id,
      type: 'url',
      br: quality
    });
  },
  
  /**
   * 获取专辑封面 URL
   * @param {string} source - 平台标识
   * @param {string} id - 歌曲 ID
   * @returns {string} 封面图片 URL
   */
  getPicUrl(source, id) {
    return this.buildUrl({
      source: source,
      id: id,
      type: 'pic'
    });
  },
  
  /**
   * 获取歌词
   * @param {string} source - 平台标识
   * @param {string} id - 歌曲 ID
   * @returns {Promise<string>} LRC 格式歌词
   */
  async getLyrics(source, id) {
    const url = this.buildUrl({
      source: source,
      id: id,
      type: 'lrc'
    });
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
      throw new Error('Failed to fetch lyrics');
    } catch (error) {
      console.error('Get Lyrics Error:', error);
      return '';
    }
  },
  
  /**
   * 获取歌单详情
   * @param {string} source - 平台标识
   * @param {string} id - 歌单 ID
   * @returns {Promise<Object>} 歌单信息
   */
  async getPlaylist(source, id) {
    const url = this.buildUrl({
      source: source,
      id: id,
      type: 'playlist'
    });
    return await this.request(url);
  },
  
  /**
   * 获取排行榜列表
   * @param {string} source - 平台标识
   * @returns {Promise<Object>} 排行榜列表
   */
  async getTopLists(source) {
    const url = this.buildUrl({
      source: source,
      type: 'toplists'
    });
    return await this.request(url);
  },
  
  /**
   * 获取排行榜歌曲
   * @param {string} source - 平台标识
   * @param {string} id - 排行榜 ID
   * @returns {Promise<Object>} 排行榜歌曲列表
   */
  async getToplistSongs(source, id) {
    const url = this.buildUrl({
      source: source,
      id: id,
      type: 'toplist'
    });
    return await this.request(url);
  },
  
  /**
   * 获取系统状态
   * @returns {Promise<Object>} 系统状态
   */
  async getStatus() {
    const url = `${this.BASE_URL}/status`;
    return await this.request(url);
  },
  
  /**
   * 健康检查
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    const url = `${this.BASE_URL}/health`;
    return await this.request(url);
  }
};

// 导出 API 模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}
