// 字流助手 - 后台脚本
// MV3 service worker 没有 window，全局对象为 self/globalThis。
// 这里提前加载常量，确保可用的默认配置在后台也能读取。
try {
  importScripts('core/constants.js');
} catch (e) {
  console.warn('⚠️ 无法加载 core/constants.js，后台将使用内置默认配置', e);
}

console.log('🚀 字流助手 Background Script 启动');

// 站点配置解析：优先使用存储的 baseURL，其次使用常量 fallback
function resolveBaseUrl() {
  const url = globalThis.ZiliuConstants?.DEFAULT_API_BASE_URL;
  return (typeof url === 'string' && url.length > 0) ? url : 'https://ziliu.online';
}

// 统一的动态配置对象（通过 getter 实时取值）
const ZILIU_CONFIG = {
  get baseUrl() { return resolveBaseUrl(); },
  getApiUrl(path = '') {
    const base = this.baseUrl;
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  },
  getEditorUrl(articleId) {
    return `${this.baseUrl}/editor/${articleId}`;
  },
  getLoginUrl() {
    return `${this.baseUrl}/login`;
  }
};

// 安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('字流助手已安装');

  // 初始化存储
  chrome.storage.local.set({
    'ziliu_settings': {
      version: '1.0.0',
      autoFill: true,
      notifications: true
    }
  });
});

// 处理插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
  console.log('字流助手图标被点击，跳转到官网');

  // 创建新标签页打开字流官网
  chrome.tabs.create({
    url: ZILIU_CONFIG.baseUrl,
    active: true
  });
});

// 处理来自网站和popup的消息
console.log('🎯 注册消息监听器');
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('📨 Background Script 收到消息:', message.action);

  // 统一消息处理器
  const messageHandlers = {
    // 获取活动标签页
    getActiveTab: async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return { tab: tabs[0] };
    },

    // 存储内容
    storeContent: async (data) => {
      await chrome.storage.local.set({
        'ziliu_content': {
          ...data,
          timestamp: Date.now(),
          source: 'website'
        }
      });
      console.log('✅ 内容已存储到扩展存储');
      notifyPlatformTabs();
      return { success: true };
    },

    // 获取存储的内容
    getStoredContent: async () => {
      const result = await chrome.storage.local.get(['ziliu_content']);
      return {
        success: true,
        data: result.ziliu_content || null
      };
    },

    // 填充内容到标签页
    fillContentToTab: async (data) => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      // 使用平台管理器检查是否支持当前页面
      const isSupported = globalThis.ZiliuPlatformManager
        ? globalThis.ZiliuPlatformManager.findPlatformByUrl(activeTab.url) !== null
        : false;

      if (!isSupported) {
        throw new Error('当前页面不支持内容填充功能');
      }

      // 发送消息到content script
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'fillContent',
          data: data
        }, (response) => {
          resolve(response || { success: false, error: '无法连接到页面' });
        });
      });
    },

    // 一键发布
    oneClickPublish: async (data) => {
      return await handleOneClickPublish(data);
    },

    // API请求代理
    apiRequest: async (requestData) => {
      return await handleApiRequest(requestData);
    },

    // 获取字流配置URL
    getZiliuUrls: async (data) => {
      return {
        success: true,
        data: {
          baseUrl: ZILIU_CONFIG.baseUrl,
          loginUrl: ZILIU_CONFIG.getLoginUrl(),
          editorUrl: data?.articleId ? ZILIU_CONFIG.getEditorUrl(data.articleId) : null
        }
      };
    },

    // 获取图片Blob (转换为Base64返回，避开CORS)
    fetchBlob: async ({ url }) => {
      try {
        console.log('🖼️ Background fetching image:', url);
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'omit', // 关键：避免带上微信的 cookie 去请求飞书图片
          mode: 'cors'
        });
        const blob = await response.blob();

        // Convert blob to base64
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onloadend = () => {
            resolve({ success: true, data: reader.result });
          };
          reader.onerror = () => {
            resolve({ success: false, error: 'Failed to read blob' });
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('❌ Fetch blob failed:', error);
        return { success: false, error: error.message };
      }
    },

    // 动态设置 API 基础地址（来自网页 /api/config 或插件设置）
    setBaseURL: async ({ baseUrl }) => {
      try {
        if (!baseUrl) return { success: false, error: 'baseUrl 为空' };
        await chrome.storage.sync.set({ apiBaseUrl: baseUrl });
        console.log('✅ 已设置 API Base URL:', baseUrl);
        return { success: true };
      } catch (e) {
        return { success: false, error: (e && e.message) || '设置失败' };
      }
    }
  };

  // 执行消息处理
  const handler = messageHandlers[message.action];
  if (handler) {
    handler(message.data)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error(`❌ 处理消息失败 [${message.action}]:`, error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放
  }

  console.warn('⚠️ 未知消息类型:', message.action);
  sendResponse({ success: false, error: '未知消息类型' });
});

// 处理API请求（解决跨域cookie问题）
async function handleApiRequest(requestData) {
  console.log('🔧 handleApiRequest 开始处理请求:', requestData);
  console.log('🔧 当前ZILIU_CONFIG.baseUrl:', ZILIU_CONFIG.baseUrl);

  try {
    // 优先使用存储中的值，再退回到动态配置
    const result = await chrome.storage.sync.get(['apiBaseUrl']);
    console.log('🔧 存储中的apiBaseUrl:', result.apiBaseUrl);
    const API_BASE_URL = result.apiBaseUrl || ZILIU_CONFIG.baseUrl;
    console.log('🔗 最终使用API基础URL:', API_BASE_URL);
    const { method = 'GET', endpoint, body, headers = {} } = requestData;

    // 验证endpoint
    if (!endpoint || !endpoint.startsWith('/')) {
      throw new Error('Invalid API endpoint');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 最终请求URL:', url);
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZiliuAssistant/3.0',
        ...headers
      },
      credentials: 'include' // 重要：包含cookie
    };

    // 只有非GET请求才添加body
    if (body && method.toUpperCase() !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log(`🌐 API请求 [${method}]:`, url, body ? '(含数据)' : '');
    console.log('📋 请求配置:', JSON.stringify(fetchOptions, null, 2));

    const response = await Promise.race([
      fetch(url, fetchOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('请求超时')), 30000)
      )
    ]);

    // 处理响应
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textData = await response.text();
      data = { message: textData };
    }

    // 检查HTTP状态
    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error(`❌ API请求失败 [${response.status}]:`, errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`✅ API请求成功 [${response.status}]:`, endpoint);
    return data;

  } catch (error) {
    // 统一错误处理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('❌ 网络连接失败，请检查服务器是否运行:', error);
      throw new Error('无法连接到服务器，请检查网络连接和服务器状态');
    }

    console.error('❌ API请求异常:', error);
    throw error;
  }
}

// 通知所有相关平台页面有新内容
function notifyPlatformTabs() {
  if (!globalThis.ZiliuPlatformManager) {
    console.warn('⚠️ 平台管理器未加载，无法通知平台页面');
    return;
  }

  // 获取所有支持的平台URL模式
  const supportedPlatforms = globalThis.ZiliuPlatformManager.getSupportedPlatforms();

  supportedPlatforms.forEach(platformId => {
    const platform = globalThis.ZiliuPlatformManager.getPlatformInfo(platformId);
    if (platform && platform.urlPatterns) {
      // 为每个URL模式查询对应的标签页
      platform.urlPatterns.forEach(pattern => {
        const queryPattern = pattern.replace('https://', '*://').replace('http://', '*://');
        chrome.tabs.query({ url: queryPattern }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'contentUpdated'
            }).catch(() => {
              // 忽略无法发送消息的错误（页面可能还未加载完成）
            });
          });
        });
      });
    }
  });
}

// 处理一键发布 - 简化为通用逻辑
async function handleOneClickPublish(data) {
  try {
    // 存储内容
    await chrome.storage.local.set({
      'ziliu_content': {
        ...data,
        timestamp: Date.now(),
        source: 'one_click_publish'
      }
    });

    console.log('🚀 开始一键发布:', data.title?.substring(0, 30) + '...');

    // 获取平台配置
    const platformConfig = getPlatformConfig(data.platform);
    if (!platformConfig) {
      throw new Error(`不支持的平台: ${data.platform}`);
    }

    return await handlePlatformPublish(data, platformConfig);

  } catch (error) {
    console.error('❌ 一键发布失败:', error);
    throw error;
  }
}

// 获取平台配置（使用平台管理服务）
function getPlatformConfig(platform) {
  // 等待平台管理器加载（在实际应用中，这应该在extension启动时初始化）
  if (!globalThis.ZiliuPlatformManager) {
    console.warn('⚠️ 平台管理器未加载，使用默认微信配置');
    // 从插件配置获取默认微信配置
    if (globalThis.ZiliuPluginConfig && globalThis.ZiliuPluginConfig.platforms) {
      const wechatPlatform = globalThis.ZiliuPluginConfig.platforms.find(p => p.id === 'wechat');
      if (wechatPlatform) {
        return {
          urlPattern: wechatPlatform.urlPatterns[0].replace('https://', '*://'),
          newTabUrl: wechatPlatform.editorUrl,
          platformName: wechatPlatform.displayName,
          loadDelay: wechatPlatform.specialHandling?.initDelay || 2000
        };
      }
    }

    // 最后的硬编码兜底（理论上不应该到这里）
    return {
      urlPattern: '*://mp.weixin.qq.com/*',
      newTabUrl: 'https://mp.weixin.qq.com/',
      platformName: '微信公众号',
      loadDelay: 2000
    };
  }

  // 规范化平台ID
  const normalizedId = globalThis.ZiliuPlatformManager.normalizePlatformId(platform) || 'wechat';

  // 获取平台发布配置
  const config = globalThis.ZiliuPlatformManager.getPlatformPublishConfig(normalizedId);

  if (!config) {
    console.warn(`⚠️ 未找到平台配置: ${platform}, 使用默认配置`);
    return globalThis.ZiliuPlatformManager.getPlatformPublishConfig('wechat');
  }

  return config;
}

// 通用的平台发布处理
async function handlePlatformPublish(data, config) {
  try {
    const { urlPattern, newTabUrl, platformName, loadDelay = 2000 } = config;

    // 查找现有的编辑页面
    const existingTabs = await chrome.tabs.query({ url: urlPattern });

    if (existingTabs.length > 0) {
      // 激活现有页面
      const targetTab = existingTabs[0];
      await chrome.tabs.update(targetTab.id, { active: true });
      console.log(`✅ 激活现有${platformName}页面`);

      return sendFillMessage(targetTab.id, data, 500);
    } else {
      // 创建新页面
      const newTab = await chrome.tabs.create({
        url: newTabUrl,
        active: true
      });
      console.log(`🆕 创建新的${platformName}页面`);

      return waitForTabAndFill(newTab.id, data, loadDelay);
    }
  } catch (error) {
    console.error(`❌ ${config.platformName}发布失败:`, error);
    throw error;
  }
}

// 发送填充消息
function sendFillMessage(tabId, data, delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: 'fillContent',
        data: data
      }, (response) => {
        resolve(response || { success: false, error: '填充失败' });
      });
    }, delay);
  });
}

// 等待Tab加载并填充
function waitForTabAndFill(tabId, data, loadDelay) {
  return new Promise((resolve) => {
    const listener = (currentTabId, changeInfo) => {
      if (currentTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);

        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'fillContent',
            data: data
          }, (response) => {
            resolve(response || { success: false, error: '填充失败' });
          });
        }, loadDelay);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // 超时保护
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve({ success: false, error: '页面加载超时' });
    }, 30000);
  });
}


// 监听标签页更新 - 支持自动填充（简化版）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 检查是否有待填充的内容
    chrome.storage.local.get(['ziliu_content'], (result) => {
      if (result.ziliu_content && result.ziliu_content.source === 'one_click_publish') {
        // 检查是否是支持的平台
        const platformConfig = findMatchingPlatform(tab.url);

        if (platformConfig) {
          console.log(`🎯 检测到${platformConfig.platformName}页面:`, tab.url);
          console.log(`🔄 自动填充内容到${platformConfig.platformName}`);

          // 延迟填充，确保页面完全加载
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
              action: 'autoFillContent',
              data: result.ziliu_content
            }).catch(error => {
              console.warn('自动填充失败:', error);
            });
          }, 1000);
        }
      }
    });
  }
});

// 查找匹配的平台配置（使用平台管理服务）
function findMatchingPlatform(url) {
  if (!globalThis.ZiliuPlatformManager) {
    console.warn('⚠️ 平台管理器未加载，无法匹配平台');
    return null;
  }

  const platform = globalThis.ZiliuPlatformManager.findPlatformByUrl(url);
  return platform?.publishConfig || null;
}

// URL匹配检查
function urlMatches(url, pattern) {
  try {
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp('^' + escapedPattern + '$', 'i');
    return regex.test(url);
  } catch (error) {
    console.warn('URL匹配失败:', { pattern, error });
    return false;
  }
}
