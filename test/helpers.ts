import { TargetBatchTree } from '../prebuild/lib';

export function sampleConfig(): TargetBatchTree {
  return {
    exact: {},
    regex: [],
    glob: [],
  };
}
