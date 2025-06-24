export { 
  CommerceStateAnnotation,
  type CommerceState,
  type CommerceStateUpdate,
  type CommerceContext,
  type CartState,
  type ComparisonState,
  type SecurityContext,
  type PerformanceMetrics,
  type AvailableActions,
  applyCommandsToState,
  createMessageCommand,
  isActionAvailable,
  getNodeAverageTime
} from './commerce-state';