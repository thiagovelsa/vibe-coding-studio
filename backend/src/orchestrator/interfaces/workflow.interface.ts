export enum AgentType {
  PRODUCT = 'product',
  CODER = 'coder',
  TEST = 'test',
  SECURITY = 'security'
}

export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum WorkflowStatus {
  PENDING = 'pending',
  REQUIREMENTS = 'requirements',
  CODING = 'coding',
  TESTING = 'testing',
  SECURITY_REVIEW = 'security_review',
  WAITING_FEEDBACK = 'waiting_feedback',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface AgentTask {
  id: string;
  workflowId: string;
  agentType: string;
  action: string;
  priority: TaskPriority;
  input: any;
  status: string;
  result?: any;
  error?: string;
  retryCount?: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  output?: any;
  parentTaskId?: string;
}

export interface HumanFeedback {
  approved: boolean;
  feedback?: string;
  files?: { [path: string]: string };
  metadata?: any;
}

export interface WorkflowState {
  id: string;
  status: string;
  previousStatus?: string;
  requirement: string;
  options: any;
  tasks: AgentTask[];
  currentTaskId?: string;
  humanFeedbackPoints: string[];
  waitingFor?: string;
  error?: string;
  context: {
    requirement: string;
    userStories?: any;
    generatedCode?: any;
    codeFiles?: { [path: string]: string };
    testResults?: any;
    securityIssues?: any;
    validationResult?: any;
    failedTests?: any;
    codeVersion?: number;
    metadata: any;
    stopOnError?: boolean;
  };
  userStories?: any;
  generatedCode?: any;
  testResults?: any;
  securityIssues?: any;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  activeTaskIds: string[];
}

export interface WorkflowOptions {
  humanFeedbackPoints?: string[];
  enableCrossValidation?: boolean;
  fixAllSecurityIssues?: boolean;
  maxConcurrentTasks?: number;
  securityLevel?: 'standard' | 'high' | 'critical';
  metadata?: any;
} 