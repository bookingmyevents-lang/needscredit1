import React from 'react';
import { HomeIcon } from './Icons';

// A generic ChevronRightIcon since it's a common UI element for breadcrumbs
const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);


interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={item.label}>
            <div className="flex items-center">
              {index === 0 ? (
                 <button onClick={item.onClick} className="text-neutral-500 hover:text-neutral-700 disabled:pointer-events-none disabled:text-neutral-500" disabled={!item.onClick}>
                  <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="sr-only">{item.label}</span>
                </button>
              ) : (
                <>
                  <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-neutral-400" aria-hidden="true" />
                  <button
                    onClick={item.onClick}
                    className={`ml-2 font-medium ${item.onClick ? 'text-neutral-500 hover:text-neutral-700' : 'text-neutral-700 pointer-events-none'}`}
                    aria-current={!item.onClick ? 'page' : undefined}
                    disabled={!item.onClick}
                  >
                    {item.label}
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
