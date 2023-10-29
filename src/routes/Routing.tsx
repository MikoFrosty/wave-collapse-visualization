import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Theme/Theme';
import Index from '@/pages/Index';
import Layout from '@/components/Layout';

const Routing = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Index />} />
        <Route path="theme" element={<Home />} />
      </Route>
    </Routes>
  );
};

export default Routing;
