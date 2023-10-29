import { styled } from '@mui/material';
import { Outlet } from 'react-router-dom';

const MainContainer = styled('div')({
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

export default function Layout() {
  return (
    <MainContainer>
      <Outlet />
    </MainContainer>
  );
}
