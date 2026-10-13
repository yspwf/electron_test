// import { useState, useEffect } from 'react';

// import { Document, Page, pdfjs } from 'react-pdf';
// import 'react-pdf/dist/Page/TextLayer.css';
// import 'react-pdf/dist/Page/AnnotationLayer.css';

// import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;



// // pdfjs.GlobalWorkerOptions.workerSrc = new URL('npm:pdfjs-dist/build/pdf.worker.min.mjs?url', import.meta.url).toString();


// const PdfDocument = ({ fileUrl }:{ fileUrl: string}) => {
//     const [totalPage, setTotalPage] = useState<number>(1);

//     const [scale, setScale] = useState(1)
//     // const fileType = file.split(";")[0].split("/")[1]
//     const [pageNumberFocus, setPageNumberFocus] = useState(false)
//     const [pageNumberInput, setPageNumberInput] = useState(1)
//     const [fullscreen, setFullscreen] = useState(false)

//     const onDocumentLoadSuccess = ({numPages}:{numPages: number}) => {
//         console.log(numPages)
//         setTotalPage(numPages);
//     }

//     useEffect(
//         () => {
//             window.addEventListener("scroll", handleScroll, true)
//             return () => {
//                 window.removeEventListener("scroll", handleScroll, true)
//             }
//         },
//         [totalPage], // eslint-disable-line react-hooks/exhaustive-deps
//         handleScroll
//     )

//     function handleScroll(e) {
//         let height = e.srcElement.documentElement.scrollTop + e.srcElement.documentElement.clientHeight
//         height = Math.ceil(height)
//         let scrollTop = e.srcElement.documentElement.scrollTop
//         let scrollHeight = e.srcElement.documentElement.scrollHeight

//         if (pageNumber !== 1 && scrollTop === 0) {
//         const page = pageNumber - 1
//         setPageNumber(page)
//         setPageNumberInput(page)
//         window.scrollTo(0, 10)
//         }
//         if (pageNumber !== numPages && height >= scrollHeight - 10) {
//         const page = pageNumber + 1
//         setPageNumber(page)
//         setPageNumberInput(page)
//         window.scrollTo(0, 10)
//         }
//     }

//     // 上一页 (lastPage)
//     function lastPage() {
//         if (pageNumber === 1) {
//         toast.info("This is the first page", 2)
//         return
//         }
//         const page = pageNumber - 1
//         setPageNumber(page)
//         setPageNumberInput(page)
//     }

//     //下一页(nextPage)
//     function nextPage() {
//         if (pageNumber === numPages) {
//         toast.info("This is the last page", 2)
//         return
//         }
//         const page = pageNumber + 1
//         setPageNumber(page)
//         setPageNumberInput(page)
//     }

//     return <>
//         <Document 
//             // file={require('./recruit.pdf')} 
//             file={new URL(fileUrl, import.meta.url).toString()}
//             loading={<div>加载中，请等待!</div>}
//             onLoadSuccess={onDocumentLoadSuccess}  
//             renderMode="canvas"
//         > 

//           // 显示全部的Pdf 文件
//           {
//               new Array(totalPage).fill('').map((item, index) => {
//                   return <div>
//                     <Page 
//                         key={index} 
//                         pageNumber={index + 1}  
//                         // renderTextLayer={false}  //不需要选中文字/复制文字，可以关掉文字
//                     />
//                     <br/>
//                 </div>
//               })
//           }

//           {/*
//           * 显示指定pdf文件
//           * <Page width={300} pageNumber={1} />
//            */}

//         </Document>
//     </>
// }

// export { PdfDocument };


import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfDocumentProps {
  fileUrl: string;
  /** 滚动容器高度，默认 100vh */
  height?: string;
}

const PdfDocument = ({ fileUrl, height = '100vh' }: PdfDocumentProps) => {
  const [totalPage, setTotalPage] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageNumberInput, setPageNumberInput] = useState('1');
  const [scale, setScale] = useState(1);
  const [hint, setHint] = useState('');

  // 真正的滚动容器
  const scrollRef = useRef<HTMLDivElement>(null);
  // 程序化滚动期间，忽略自动翻页判断
  const ignoreScrollRef = useRef(false);
  // 记录每页 DOM
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const showHint = useCallback((msg: string) => {
    setHint(msg);
    window.setTimeout(() => setHint(''), 2000);
  }, []);

  // 转 URL
  const file = useMemo(() => {
    if (!fileUrl) return null;
    try {
      return new URL(fileUrl, import.meta.url).toString();
    } catch {
      return fileUrl;
    }
  }, [fileUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPage(numPages);
    setPageNumber(1);
    setPageNumberInput('1');
  }, []);

  /** 跳转到指定页（点击按钮时用） */
  const scrollToPage = useCallback((page: number) => {
    const container = scrollRef.current;
    const target = pageRefs.current.get(page);
    if (!container || !target) return;

    ignoreScrollRef.current = true;
    container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });

    window.setTimeout(() => {
      ignoreScrollRef.current = false;
    }, 500);
  }, []);

  const gotoPage = useCallback(
    (page: number, doScroll = true) => {
      const next = Math.min(Math.max(Math.floor(page), 1), totalPage);
      setPageNumber(next);
      setPageNumberInput(String(next));
      if (doScroll) scrollToPage(next);
      return next;
    },
    [totalPage, scrollToPage]
  );

  /** 上一页 */
  const lastPage = useCallback(() => {
    if (pageNumber <= 1) {
      showHint('已经是第一页了');
      return;
    }
    gotoPage(pageNumber - 1);
  }, [pageNumber, gotoPage, showHint]);

  /** 下一页 */
  const nextPage = useCallback(() => {
    if (pageNumber >= totalPage) {
      showHint('已经是最后一页了');
      return;
    }
    gotoPage(pageNumber + 1);
  }, [pageNumber, totalPage, gotoPage, showHint]);

  /** 输入框跳页 */
  const handleJump = useCallback(() => {
    const v = Number(pageNumberInput);
    if (!Number.isFinite(v) || v < 1 || v > totalPage) {
      showHint(`请输入 1 ~ ${totalPage} 之间的页码`);
      setPageNumberInput(String(pageNumber));
      return;
    }
    gotoPage(v);
  }, [pageNumberInput, pageNumber, totalPage, gotoPage, showHint]);

  // 监听内部滚动容器的滚动，实时更新当前页
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (ignoreScrollRef.current) return;

      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      const centerLine = scrollTop + clientHeight / 2;

      // 找到中线落在哪一页
      let current = 1;
      pageRefs.current.forEach((el, page) => {
        const top = el.offsetTop - container.offsetTop;
        const bottom = top + el.offsetHeight;
        if (centerLine >= top && centerLine < bottom) {
          current = page;
        }
      });

      setPageNumber((prev) => (prev === current ? prev : current));
      setPageNumberInput((prev) =>
        Number(prev) === current ? prev : String(current)
      );
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [totalPage]);

  // 全屏切换
  const [fullscreen, setFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    setFullscreen((f) => !f);
  }, []);

  return (
    <div
      style={{
        position: fullscreen ? 'fixed' : 'relative',
        inset: fullscreen ? 0 : undefined,
        zIndex: fullscreen ? 9999 : undefined,
        background: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        height: fullscreen ? '100vh' : height,
        width: '100%',
      }}
    >
      {/* 工具栏（固定在顶部，不随滚动消失） */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: '#fff',
          borderBottom: '1px solid #e5e5e5',
          zIndex: 10,
        }}
      >
        <button type="button" onClick={lastPage}>
          上一页
        </button>

        <input
          value={pageNumberInput}
          onChange={(e) => setPageNumberInput(e.target.value)}
          onBlur={handleJump}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          style={{ width: 60, textAlign: 'center', padding: '4px 6px' }}
        />
        <span>/ {totalPage}</span>

        <button type="button" onClick={nextPage}>
          下一页
        </button>

        <div style={{ width: 12 }} />

        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
        >
          缩小
        </button>
        <span style={{ minWidth: 48, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)))}
        >
          放大
        </button>

        <div style={{ width: 12 }} />

        <button type="button" onClick={toggleFullscreen}>
          {fullscreen ? '退出全屏' : '全屏'}
        </button>

        {hint && (
          <span style={{ marginLeft: 12, color: '#e67e22', fontSize: 13 }}>{hint}</span>
        )}
      </div>

      {/* 真正的滚动容器：鼠标滚轮直接作用于这里 */}
      <div
        ref={scrollRef}
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: 16,
        }}
      >
        {/*
          file的值可以是URL、base64、Uint8Array等等，
          loading 加载数据的时候显示的内容
          onLoadSuccess 加载成功后回调的方法，我这里设置了pdf的总页数
          noData：我这里是file没有值时就显示加载的图标<Spin/>
          error 加载错误的时候可以做的
        */}
        <Document
          file={file}
          loading={<div style={{ padding: 24 }}>加载中，请等待!</div>}
          error={<div style={{ padding: 24 }}>PDF 加载失败，请检查文件地址。</div>}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(err) => console.error('PDF load error:', err)}
          renderMode="canvas"
          noData={<div style={{ float: 'left', marginLeft: '50%', marginTop: '10%' }}>1231231</div>}
        >
          {Array.from({ length: totalPage }, (_, i) => {
            const page = i + 1;
            return (
              <div
                key={page}
                ref={(el) => {
                  if (el) pageRefs.current.set(page, el);
                  else pageRefs.current.delete(page);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Page
                  pageNumber={page}
                  scale={scale}
                  loading=""
                  // renderTextLayer={false} // 不需要选中文字时可关掉，性能更好
                />
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
};

export { PdfDocument };

