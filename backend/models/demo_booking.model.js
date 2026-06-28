module.exports = (sequelize, Sequelize) => {
  const DemoBooking = sequelize.define('demo_booking', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false },
    company: { type: Sequelize.STRING, allowNull: false },
    teamSize: { type: Sequelize.STRING, allowNull: true },
    date: { type: Sequelize.DATEONLY, allowNull: false },
    time: { type: Sequelize.STRING, allowNull: false },
    status: {
      type: Sequelize.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    notes: { type: Sequelize.TEXT, allowNull: true },
  }, {
    tableName: 'demo_bookings',
    timestamps: true,
  });

  return DemoBooking;
};
