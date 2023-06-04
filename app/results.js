"use client";

import { Severity } from "./_lib/types";

const renderSeverity = (severity) => {
  switch (severity) {
    case Severity.Critical:
      return (
        <>
          <div className="flex-none rounded-full bg-neutral-950/20 p-1">
            <div className="h-1.5 w-1.5 rounded-full bg-neutral-950" />
          </div>
          <p className="text-xs leading-5 text-gray-500">Critical</p>
        </>
      );
    case Severity.High:
      return (
        <>
          <div className="flex-none rounded-full bg-red-500/20 p-1">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
          </div>
          <p className="text-xs leading-5 text-gray-500">High</p>
        </>
      );
    case Severity.Medium:
      return (
        <>
          <div className="flex-none rounded-full bg-orange-500/20 p-1">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          </div>
          <p className="text-xs leading-5 text-gray-500">Medium</p>
        </>
      );
    case Severity.Low:
      return (
        <>
          <div className="flex-none rounded-full bg-yellow-500/20 p-1">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          </div>
          <p className="text-xs leading-5 text-gray-500">Low</p>
        </>
      );
    case Severity.Informational:
      return (
        <>
          <div className="flex-none rounded-full bg-gray-500/20 p-1">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
          </div>
          <p className="text-xs leading-5 text-gray-500">Informational</p>
        </>
      );
    case Severity.Unknown:
      return (
        <>
          <div className="flex-none rounded-full bg-gray-500/20 p-1">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
          </div>
          <p className="text-xs leading-5 text-gray-500">Unknown</p>
        </>
      );
  }
};

export default function ResultsTable({ results }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {results.map((result) => (
        <li
          key={result.issueType.name + result.file}
          className="flex justify-between gap-x-6 py-5"
        >
          <div className="flex gap-x-4">
            <div className="min-w-0 flex-auto">
              <p className="text-sm font-semibold leading-6 text-gray-900">
                {result.issueType.name}
              </p>
              <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                {result.file}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex sm:flex-col sm:items-end">
            <p className="text-sm leading-6 text-gray-900">{result.results}</p>
            <div className="mt-1 flex items-center gap-x-1.5">
              {renderSeverity(result.issueType.severity)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
