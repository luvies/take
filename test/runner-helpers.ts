export function runnerSample(execute: (target: any) => (...args: string[]) => void) {
  return {
    '': { execute: execute('') },
    1: {
      execute: execute(1),
      children: {
        2: { execute: execute(2) },
        3: { execute: execute(3) },
        4: {
          execute: execute(4),
          children: {
            5: {
              deps: '^:^',
              execute: execute(5)
            },
            6: {
              deps: '7',
              execute: execute(6),
              children: {
                7: { execute: execute(7) },
                8: {
                  deps: '^:7',
                  execute: execute(8)
                }
              }
            },
            9: {
              deps: '^:^:2',
              execute: execute(9)
            }
          }
        }
      }
    },
    10: {
      deps: ':1',
      execute: execute(10)
    },
    11: {
      deps: [':4'],
      execute: execute(11)
    },
    12: {
      deps: [':3'],
      execute: execute(12)
    },
    13: {
      deps: '10',
      execute: execute(13)
    },
    14: {
      deps: ':3',
      execute: execute(14)
    },
    15: {
      deps: ':16',
      execute: execute(15)
    },
    16: {
      deps: ':17',
      execute: execute(16)
    },
    17: {
      execute: execute(17)
    },
    18: {
      deps: [':1'],
      execute: execute(18)
    },
    19: {
      deps: [':1', ':1:2'],
      execute: execute(19)
    },
    20: {
      deps: [':1', ':1'],
      execute: execute(20)
    },
    21: {
      deps: [':1', ':10'],
      execute: execute(21)
    },
  };
}
