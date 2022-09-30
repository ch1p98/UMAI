const foo = (min, max) => {
  if (min < max - 1) {
    console.log(min);
    foo(min + 1, max);
  }
};
//foo(1, 40);

// 谷哥上課

const factorial = (n) => {
  if (n > 0) {
    return n * factorial(n - 1);
  } else if (n < 0) {
    console.log("error input");
    return;
  }
  return 1;
};

console.log(factorial(10));

const fibbonacci = (arr, n, i) => {
  if (i > n) return;

  if (i === 1 || i === 2) {
    arr.push(1);
    fibbonacci(arr, n, i + 1);

    //return arr[0]
  } else {
    arr.push(arr[i - 2] + arr[i - 3]);
    fibbonacci(arr, n, i + 1);
  }
};

const fib_wo_recursion = (arr, i) => {
  if (i === 1) {
  }
};

let arr = [];
fibbonacci(arr, 40, 1);
console.log("arr:", arr);
