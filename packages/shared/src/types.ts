export type TargetSite = 'chatgpt' | 'gemini' | 'flow' | 'claude';

export type JobStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed';

export interface JobAttachment {
  name: string;
  type: string;
  content: string; // base64 or raw text
}

export interface JobLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  step?: string;
  screenshotUrl?: string;
}

export interface Job {
  id: string;
  workspaceId?: string;
  productId?: string;
  targetSite: TargetSite;
  prompt: string;
  attachments?: JobAttachment[];
  status: JobStatus;
  progress?: number;
  currentStep?: string;
  resultMarkdown?: string;
  mediaUrls?: string[];
  error?: string;
  failureScreenshot?: string;
  logs?: JobLogEntry[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// Extension <-> Web Message Types
export interface PingMessage {
  type: 'PING';
  timestamp: number;
}

export interface PongMessage {
  type: 'PONG';
  timestamp: number;
  extensionId: string;
  version: string;
  status: 'idle' | 'busy' | 'paused';
  supportedSites: TargetSite[];
  activeJobsCount: number;
}

export interface GetStatusMessage {
  type: 'GET_STATUS';
}

export interface StatusResponseMessage {
  type: 'STATUS_RESPONSE';
  status: 'idle' | 'busy' | 'paused';
  isPaused: boolean;
  activeJob?: Job;
  queueLength: number;
  extensionId: string;
  version: string;
}

export interface RunJobMessage {
  type: 'RUN_JOB';
  job: Job;
}

export interface JobProgressMessage {
  type: 'JOB_PROGRESS';
  jobId: string;
  status: JobStatus;
  currentStep: string;
  progress: number;
  log?: JobLogEntry;
}

export interface JobResultMessage {
  type: 'JOB_RESULT';
  jobId: string;
  status: 'completed' | 'failed' | 'paused';
  resultMarkdown?: string;
  mediaUrls?: string[];
  error?: string;
  failureScreenshot?: string;
}

export interface PauseQueueMessage {
  type: 'PAUSE_QUEUE';
}

export interface ResumeQueueMessage {
  type: 'RESUME_QUEUE';
}

export interface CheckSiteReadyMessage {
  type: 'CHECK_SITE_READY';
  site: TargetSite;
}

export interface SiteReadyResponse {
  type: 'SITE_READY_RESPONSE';
  site: TargetSite;
  isReady: boolean;
  isLoggedIn: boolean;
  currentUrl?: string;
  message?: string;
}

// Window Bridge Messages (between web page and content script)
export type SCSBridgeMessage =
  | { type: 'SCS_DISCOVER_EXTENSION' }
  | { type: 'SCS_EXTENSION_DETECTED'; extensionId: string; version: string }
  | { type: 'SCS_FORWARD_MESSAGE'; payload: ExtensionRequestMessage; requestId: string }
  | { type: 'SCS_FORWARD_RESPONSE'; response: ExtensionResponseMessage; requestId: string; error?: string };

export type ExtensionRequestMessage =
  | PingMessage
  | GetStatusMessage
  | RunJobMessage
  | PauseQueueMessage
  | ResumeQueueMessage
  | CheckSiteReadyMessage;

export type ExtensionResponseMessage =
  | PongMessage
  | StatusResponseMessage
  | JobProgressMessage
  | JobResultMessage
  | SiteReadyResponse
  | { type: 'ERROR'; error: string };
