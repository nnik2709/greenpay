
const generateRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const nationalities = ['Australian', 'American', 'German', 'French', 'Papua New Guinean', 'Chinese', 'New Zealander'];
const paymentMethods = ['Card', 'Cash'];

const generateMockData = (count) => {
  const data = [];
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');

  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.3 ? 'Individual' : 'Corporate';
    data.push({
      id: i + 1,
      date: generateRandomDate(startDate, endDate),
      amount: Math.floor(Math.random() * (type === 'Individual' ? 200 : 1000)) + 50,
      type: type,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
    });
  }
  return data;
};

export const mockTransactions = generateMockData(500);
