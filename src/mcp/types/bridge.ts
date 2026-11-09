export type OperationType =
  | 'GET_STATE'
  | 'GET_SUMMARY'
  | 'CREATE_SHAPE'
  | 'CREATE_TEXT'
  | 'UPDATE_SHAPE'
  | 'DELETE_SHAPE'
  | 'DUPLICATE_SHAPE'
  | 'CONNECT_SHAPES'
  | 'UPDATE_CONNECTOR'
  | 'DELETE_CONNECTOR'
  | 'GROUP_ELEMENTS'
  | 'ARRANGE_DIAGRAM'
  | 'MOVE_ELEMENTS'
  | 'CLEAR_CANVAS'
  | 'UNDO_LAST'
  | 'EXPORT_DIAGRAM'
  | 'CREATE_DIAGRAM';

export interface BridgeMessage<T = unknown> {
  id: string;
  type: string;
  sessionId?: string;
  payload: T;
  timestamp: number;
}

export interface ExecuteOperationPayload {
  operation: OperationType;
  params: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface OperationResultPayload<T = unknown> {
  success: boolean;
  operation: OperationType;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SessionRegisterPayload {
  sessionId: string;
  boardName?: string;
  elementCount: number;
  viewport?: {
    zoom: number;
    scrollX: number;
    scrollY: number;
  };
}
