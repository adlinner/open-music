/**
 * Open Music - Storage Module
 * IndexedDB 和 LocalStorage 数据存储管理
 */

const Storage = {
  DB_NAME: 'OpenMusicDB',
  DB_VERSION: 1,
  db: null,
  
  // 数据表名称
  STORES: {
    PLAYLISTS: 'playlists',
    SONGS: 'songs',
    HISTORY: 'history',
    FAVORITES: 'favorites'
  },
  
  /**
   * 初始化数据库
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('Failed to open database');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database initialized');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建歌单表
        if (!db.objectStoreNames.contains(this.STORES.PLAYLISTS)) {
          const playlistStore = db.createObjectStore(this.STORES.PLAYLISTS, {
            keyPath: 'id',
            autoIncrement: true
          });
          playlistStore.createIndex('name', 'name', { unique: false });
          playlistStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // 创建歌曲表
        if (!db.objectStoreNames.contains(this.STORES.SONGS)) {
          const songStore = db.createObjectStore(this.STORES.SONGS, {
            keyPath: 'uniqueId'
          });
          songStore.createIndex('playlistId', 'playlistId', { unique: false });
        }
        
        // 创建播放历史表
        if (!db.objectStoreNames.contains(this.STORES.HISTORY)) {
          const historyStore = db.createObjectStore(this.STORES.HISTORY, {
            keyPath: 'id',
            autoIncrement: true
          });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // 创建收藏表
        if (!db.objectStoreNames.contains(this.STORES.FAVORITES)) {
          const favStore = db.createObjectStore(this.STORES.FAVORITES, {
            keyPath: 'uniqueId'
          });
          favStore.createIndex('addedAt', 'addedAt', { unique: false });
        }
      };
    });
  },
  
  /**
   * 执行数据库事务
   */
  async transaction(storeName, mode, callback) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      callback(store, resolve, reject);
    });
  },
  
  // ==================== 歌单管理 ====================
  
  /**
   * 创建歌单
   */
  async createPlaylist(name, description = '') {
    const playlist = {
      name: name,
      description: description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      songCount: 0
    };
    
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.PLAYLISTS, 'readwrite', (store, _, reject) => {
        const request = store.add(playlist);
        request.onsuccess = () => {
          playlist.id = request.result;
          resolve(playlist);
        };
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 获取所有歌单
   */
  async getAllPlaylists() {
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.PLAYLISTS, 'readonly', (store) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 获取单个歌单
   */
  async getPlaylist(id) {
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.PLAYLISTS, 'readonly', (store) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 更新歌单
   */
  async updatePlaylist(id, updates) {
    const playlist = await this.getPlaylist(id);
    if (!playlist) {
      throw new Error('Playlist not found');
    }
    
    const updatedPlaylist = {
      ...playlist,
      ...updates,
      updatedAt: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.PLAYLISTS, 'readwrite', (store) => {
        const request = store.put(updatedPlaylist);
        request.onsuccess = () => resolve(updatedPlaylist);
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 删除歌单
   */
  async deletePlaylist(id) {
    // 先删除歌单中的所有歌曲
    await this.removeAllSongsFromPlaylist(id);
    
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.PLAYLISTS, 'readwrite', (store) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  // ==================== 歌曲管理 ====================
  
  /**
   * 添加歌曲到歌单
   */
  async addSongToPlaylist(playlistId, song) {
    const uniqueId = `${song.platform}_${song.id}_${playlistId}`;
    const songData = {
      uniqueId: uniqueId,
      playlistId: playlistId,
      ...song,
      addedAt: Date.now()
    };
    
    return new Promise(async (resolve, reject) => {
      this.transaction(this.STORES.SONGS, 'readwrite', (store) => {
        const request = store.add(songData);
        request.onsuccess = async () => {
          // 更新歌单歌曲数量
          const playlist = await this.getPlaylist(playlistId);
          await this.updatePlaylist(playlistId, {
            songCount: (playlist.songCount || 0) + 1
          });
          resolve(songData);
        };
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 获取歌单中的所有歌曲
   */
  async getPlaylistSongs(playlistId) {
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.SONGS, 'readonly', (store) => {
        const index = store.index('playlistId');
        const request = index.getAll(playlistId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 从歌单移除歌曲
   */
  async removeSongFromPlaylist(uniqueId, playlistId) {
    return new Promise(async (resolve, reject) => {
      this.transaction(this.STORES.SONGS, 'readwrite', (store) => {
        const request = store.delete(uniqueId);
        request.onsuccess = async () => {
          // 更新歌单歌曲数量
          const playlist = await this.getPlaylist(playlistId);
          await this.updatePlaylist(playlistId, {
            songCount: Math.max((playlist.songCount || 1) - 1, 0)
          });
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 移除歌单中的所有歌曲
   */
  async removeAllSongsFromPlaylist(playlistId) {
    const songs = await this.getPlaylistSongs(playlistId);
    const promises = songs.map(song => 
      this.removeSongFromPlaylist(song.uniqueId, playlistId)
    );
    return Promise.all(promises);
  },
  
  // ==================== 播放历史 ====================
  
  /**
   * 添加到播放历史
   */
  async addToHistory(song) {
    const historyItem = {
      ...song,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.HISTORY, 'readwrite', (store) => {
        const request = store.add(historyItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 获取播放历史
   */
  async getHistory(limit = 50) {
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.HISTORY, 'readonly', (store) => {
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev');
        const results = [];
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 清空播放历史
   */
  async clearHistory() {
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.HISTORY, 'readwrite', (store) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  // ==================== 收藏管理 ====================
  
  /**
   * 添加到收藏
   */
  async addToFavorites(song) {
    const uniqueId = `${song.platform}_${song.id}`;
    const favoriteItem = {
      uniqueId: uniqueId,
      ...song,
      addedAt: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.FAVORITES, 'readwrite', (store) => {
        const request = store.add(favoriteItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 从收藏移除
   */
  async removeFromFavorites(platform, id) {
    const uniqueId = `${platform}_${id}`;
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.FAVORITES, 'readwrite', (store) => {
        const request = store.delete(uniqueId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 检查是否已收藏
   */
  async isFavorite(platform, id) {
    const uniqueId = `${platform}_${id}`;
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.FAVORITES, 'readonly', (store) => {
        const request = store.get(uniqueId);
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  /**
   * 获取所有收藏
   */
  async getAllFavorites() {
    return new Promise((resolve, reject) => {
      this.transaction(this.STORES.FAVORITES, 'readonly', (store) => {
        const index = store.index('addedAt');
        const request = index.openCursor(null, 'prev');
        const results = [];
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  },
  
  // ==================== LocalStorage 设置 ====================
  
  /**
   * 保存设置
   */
  saveSetting(key, value) {
    try {
      localStorage.setItem(`openmusic_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  },
  
  /**
   * 获取设置
   */
  getSetting(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(`openmusic_${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return defaultValue;
    }
  },
  
  /**
   * 删除设置
   */
  removeSetting(key) {
    try {
      localStorage.removeItem(`openmusic_${key}`);
    } catch (error) {
      console.error('Failed to remove setting:', error);
    }
  }
};

// 导出 Storage 模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
