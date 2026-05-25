import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';

/** 根组件 */
export function App() {
  return <RouterProvider router={router} />;
}
