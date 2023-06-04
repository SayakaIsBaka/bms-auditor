'use client';

import Image from 'next/image'
import { openDirectory } from './_lib/folder_picker';
import { processFolder } from './_lib/process';
import ResultsTable from './results';
import { useState } from 'react';

export default function Home() {
  const [results, setResults] = useState();

  const loadFolder = async () => {
    let folder = await openDirectory();
    if (folder === undefined)
      return;
    // Filter subfolders
    folder = folder.filter(e => e.webkitRelativePath.split('/').length === 2);
    let res = await processFolder(folder);
    if (res !== null) {
      // display results
      setResults((
        <ResultsTable results={res} />
      ));
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">app/page.js</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{' '}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center">
      <a
          onClick={loadFolder}
          style={{cursor: "pointer"}}
          rel="noopener noreferrer"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Load{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Select the BMS folder to analyze.
          </p>
        </a>
      </div>
      <div className="mb-32 border-gray-300 bg-gray-100 px-5 py-4 rounded-lg border border-transparent">
        {results}
      </div>
    </main>
  )
}
