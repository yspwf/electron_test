import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import { Layout } from '@/layout';
import { PdfDocument } from '@/pdf';
// import { Tiptap } from '@/tiptap';
import { TiptapEditor } from './TiptapEditor';



// const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('@/pages/About'))

const routers = createBrowserRouter([
    {
        path: '/',
        element: <Layout/>,
        children: [
            { path: '', element: <PdfDocument fileUrl='./secrit.pdf'/> },
            { path: 'about', element: <About /> },
            { path: 'tiptap', element: <TiptapEditor /> }
        ]
    }
])

const AppRouter = () => {
  return <RouterProvider router={routers} />
}

export  { AppRouter };