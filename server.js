const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'expenses.json');
const CARS_FILE = path.join(__dirname, 'cars.json');

app.use(express.json());
app.use(express.static('public'));

// Helpers for Expenses
function readExpenses() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = [
      { id: 1, car: 'Ferrari 812', title: 'V12 Fuel Fill-up', category: 'Fuel', amount: 150, mileage: '12,400', date: '2026-10-01' },
      { id: 2, car: 'Ferrari 812', title: 'Carbon Aero Kit', category: 'Mods', amount: 4500, mileage: '12,500', date: '2026-10-03' },
      { id: 3, car: 'Hennessey Venom F5', title: 'Comprehensive Insurance', category: 'Insurance', amount: 2400, mileage: '1,200', date: '2026-10-05' },
      { id: 4, car: 'Daily Moped', title: 'Brake Pad Replacement', category: 'Maintenance', amount: 120, mileage: '3,500', date: '2026-10-08' }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
}

function writeExpenses(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

// Helpers for Cars
function readCars() {
  if (!fs.existsSync(CARS_FILE)) {
    const initialCars = ['Ferrari 812', 'Hennessey Venom F5', 'Daily Moped'];
    fs.writeFileSync(CARS_FILE, JSON.stringify(initialCars, null, 2));
    return initialCars;
  }
  return JSON.parse(fs.readFileSync(CARS_FILE, 'utf8') || '[]');
}

function writeCars(cars) {
  fs.writeFileSync(CARS_FILE, JSON.stringify(cars, null, 2));
}

// --- CAR API ENDPOINTS ---
app.get('/api/cars', (req, res) => {
  res.json(readCars());
});

app.post('/api/cars', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Car name is required' });
  
  const cars = readCars();
  if (cars.includes(name)) return res.status(400).json({ error: 'Car already exists' });

  cars.push(name);
  writeCars(cars);
  res.status(201).json({ name });
});

app.delete('/api/cars/:name', (req, res) => {
  const carName = decodeURIComponent(req.params.name);
  let cars = readCars();
  cars = cars.filter(c => c !== carName);
  writeCars(cars);
  res.json({ message: 'Car deleted' });
});

// --- EXPENSE API ENDPOINTS ---
app.get('/api/expenses', (req, res) => {
  const { category, car, search } = req.query;
  let expenses = readExpenses();

  if (category && category !== 'All') {
    expenses = expenses.filter(item => item.category === category);
  }
  if (car && car !== 'All') {
    expenses = expenses.filter(item => item.car === car);
  }
  if (search) {
    expenses = expenses.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));
  }

  const allExpenses = readExpenses();
  const totalSpent = allExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  const categoryTotals = { Fuel: 0, Mods: 0, Maintenance: 0, Insurance: 0 };
  allExpenses.forEach(item => {
    if (categoryTotals[item.category] !== undefined) {
      categoryTotals[item.category] += Number(item.amount);
    }
  });

  res.json({ expenses, totalSpent, totalItems: allExpenses.length, categoryTotals });
});

app.post('/api/expenses', (req, res) => {
  const { car, title, category, amount, mileage, date } = req.body;
  if (!car || !title || !category || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields!' });
  }

  const expenses = readExpenses();
  const newExpense = {
    id: Date.now(),
    car,
    title,
    category,
    amount: Number(amount),
    mileage: mileage || 'N/A',
    date
  };

  expenses.push(newExpense);
  writeExpenses(expenses);
  res.status(201).json(newExpense);
});

app.delete('/api/expenses/:id', (req, res) => {
  const id = Number(req.params.id);
  let expenses = readExpenses();
  expenses = expenses.filter(exp => exp.id !== id);
  writeExpenses(expenses);
  res.json({ message: 'Deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`🚀 Garage server running at http://localhost:${PORT}`);
});