import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
    return <div>
    <Link to='/about'>about</Link>
    <Link to='/'>home</Link>
    <Link to='/tiptap'>tiptap</Link>
        <main>
            <Outlet />
        </main>
    </div>
}

export {Layout};
