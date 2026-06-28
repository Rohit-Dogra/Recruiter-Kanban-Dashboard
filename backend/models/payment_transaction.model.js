module.exports = (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define("payment_transactions", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'userId' },
    planId: { type: DataTypes.INTEGER, allowNull: false, field: 'planId' },
    merchantTransactionId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: 'merchant_transaction_id' },
    paymentId: { type: DataTypes.STRING(100), allowNull: true, field: 'payment_id' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'INITIATED' },
    paymentType: { type: DataTypes.STRING(50), defaultValue: 'subscription', field: 'payment_type' },
    metadata: { type: DataTypes.JSON, allowNull: true },
    gatewayOrderId: { type: DataTypes.STRING(255), allowNull: true, field: 'gateway_order_id' },
    gatewayPaymentId: { type: DataTypes.STRING(255), allowNull: true, field: 'gateway_payment_id' },
    gatewaySignature: { type: DataTypes.STRING(255), allowNull: true, field: 'gateway_signature' },
    gateway: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'razorpay', field: 'gateway' },
    billingCycle: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'monthly', field: 'billing_cycle' }
  }, {
    timestamps: true,
    underscored: false,
    tableName: 'payment_transactions'
  });
  return PaymentTransaction;
};
