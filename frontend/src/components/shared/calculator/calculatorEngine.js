/**
 * Safe calculation evaluator for iOS/macOS styled calculator
 */
export function calculate(firstOperand, operator, secondOperand) {
  const num1 = parseFloat(firstOperand);
  const num2 = parseFloat(secondOperand);
  if (isNaN(num1) || isNaN(num2)) return num2 || num1 || 0;

  let result = 0;
  switch (operator) {
    case '+':
      result = num1 + num2;
      break;
    case '−':
    case '-':
      result = num1 - num2;
      break;
    case '×':
    case '*':
      result = num1 * num2;
      break;
    case '÷':
    case '/':
      if (num2 === 0) return 'Error';
      result = num1 / num2;
      break;
    default:
      return num2;
  }

  // Handle precision
  const rounded = Math.round(result * 100000000) / 100000000;
  return rounded;
}

export const formatDisplay = (val) => {
  if (val === 'Error') return 'Error';
  const parts = String(val).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const formattedInteger = Number(integerPart).toLocaleString('en-US');
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }
  return formattedInteger;
};

export const getDisplayFontSize = (text) => {
  const len = String(text).length;
  if (len > 10) return 'text-3xl';
  if (len > 7) return 'text-4xl';
  return 'text-5xl';
};
