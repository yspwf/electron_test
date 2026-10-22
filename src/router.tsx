import { RouterProvider, createBrowserRouter, createHashRouter } from 'react-router-dom';
import { lazy } from 'react';
import { Layout } from '@/layout';
import { PdfDocument } from '@/pdf';
// import { Tiptap } from '@/tiptap';
import { TiptapEditor } from './TiptapEditor';
// import NotesApp from '@/editer';
import { Editor } from './newEditer';




// const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('@/pages/About'))

const routers = createHashRouter([
    {
        path: '/',
        element: <Layout/>,
        children: [
            { path: '', element: <PdfDocument fileUrl='./secrit.pdf'/> },
            { path: 'about', element: <About /> },
            { path: 'tiptap', element: <TiptapEditor /> },
            { path: 'editer', element: <Editor /> }
        ]
    }
])

const AppRouter = () => {
  return <RouterProvider router={routers} />
}

export  { AppRouter };