import React from 'react';
import Clock from './Clock';
import Weather from './Weather';

const DashboardInfo: React.FC = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 md:my-8">
      <Clock />
      <Weather />
    </section>
  );
};

export default DashboardInfo;
