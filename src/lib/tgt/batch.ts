import { Target } from './target';

/**
 * A batch of targets that are using exact names.
 */
export type ExactTargetBatch = Record<string, Target>;

/**
 * A regex rule target.
 */
export type RegexTargetBatch = Array<{
  rule: RegExp;
  target: Target;
}>;

/**
 * A glob rule target.
 */
export type GlobTargetBatch = Array<{
  rule: string;
  target: Target;
}>;

/**
 * A tree of target batches.
 */
export interface TargetBatchTree {
  exact: ExactTargetBatch;
  regex: RegexTargetBatch;
  glob: GlobTargetBatch;
}
