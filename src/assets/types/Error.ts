/**
 * 错误日志相关类型定义
 */

export interface ErrorCodeInfo {
  code: string;
  category: 'network' | 'http' | 'javascript' | 'promise' | 'vue' | 'router' | 'storage' | 'worker' | 'resource' | 'data' | 'unknown';
  titleKey: string;
  descriptionKey: string;
}

export interface LogEntry {
  id: string;
  code: string;
  category: string;
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  component?: string;
  context?: any;
}
