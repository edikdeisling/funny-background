function throttle<Fn extends (...args: any[]) => void>(fn: Fn, time = 50) {
  let timeout: number | undefined;
  let fnArgs: Parameters<Fn> | [] = [];

  return (...args: Parameters<Fn>) => {
    fnArgs = args;
    if (!timeout) {
      timeout = setTimeout(() => {
        fn(...fnArgs);
        timeout = undefined;
        fnArgs = [];
      }, time);
    }
  };
}

export {
  throttle,
};
