// const Transaction = require('../models/transaction');
// const getTransactions= async (req, res) => {
//   try {

//     const transactions = await Transaction.find({ user: req.user._id })
//                                           .sort({ date: -1 });

//     res.status(200).json(transactions);
    
//   } catch (error) {
//     res.status(500).send({ error: 'Server error fetching transactions.' });
//   }
// }
// const createTransactions =async (req, res) => {
//   try {
//     const { title, amount, type, date, category } = req.body;
    
//     const newTransaction = new Transaction({
//       title,
//       amount,
//       type,
//       date,
//       category,
//       user: req.user._id
//     });

//     await newTransaction.save();
//     res.status(201).json(newTransaction);
    
//   } catch (error) {
//     res.status(400).send({ error: 'Error creating transaction.' });
//   }
// }
// const deleteTransaction = async (req, res) => {
//   try {
//     const { id } = req.params;


//     const transaction = await Transaction.findById(id);

//     if (!transaction) {
//       return res.status(404).json({ msg: 'Transaction not found' });
//     }

//     if (transaction.user.toString() !== req.user._id.toString()) {
//       return res.status(401).json({ msg: 'User not authorized' });
//     }

//     await Transaction.findByIdAndDelete(id);

//     res.json({ msg: 'Transaction removed' });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('Server Error');
//   }
// }


// module.exports= {
//     getTransactions,
//     createTransactions,
//     deleteTransaction
// }

const Transaction = require('../models/transaction');

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
                                          .sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).send({ error: 'Server error fetching transactions.' });
  }
}

const createTransactions = async (req, res) => {
  try {
    const { title, amount, type, date, category } = req.body;
    const transactionAmount = Number(amount);
    let alertMessage = null;

    const stats = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          avgExpense: { $avg: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", null] } }
        }
      }
    ]);

    const data = stats[0] || { totalIncome: 0, totalExpense: 0, avgExpense: 0 };
    const currentBalance = data.totalIncome - data.totalExpense;
    const simulatedBalance = type === 'income' 
      ? currentBalance + transactionAmount 
      : currentBalance - transactionAmount;

    if (simulatedBalance < 0) {
      alertMessage = "Warning: Your balance is negative.";
    } else if (type === 'expense' && data.avgExpense && transactionAmount > (data.avgExpense * 3)) {
      alertMessage = `Unusual Spending: ₹${transactionAmount} is unexpectedly high compared to your average (₹${Math.round(data.avgExpense)}).`;
    }

    const newTransaction = new Transaction({
      title,
      amount: transactionAmount,
      type,
      date,
      category,
      user: req.user._id
    });

    await newTransaction.save();

    res.status(201).json({
      transaction: newTransaction,
      alert: alertMessage ? { type: 'warning', message: alertMessage } : null
    });
    
  } catch (error) {
    res.status(400).send({ error: 'Error creating transaction.' });
  }
}

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Transaction.findByIdAndDelete(id);

    res.json({ msg: 'Transaction removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

module.exports = {
    getTransactions,
    createTransactions,
    deleteTransaction
}