"use client";

import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,          // <-- NEW Dashboard Icon
  faLocationDot,
  faUserPlus,
  faUserMinus,
  faPenToSquare,
  faSearch,
  faClipboardList,
  faReceipt,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import Link from 'next/link';
// icons for sidebar menu
const menuItems = [
  { name: "Dashboard", icon: faGauge, href: "/dashboard" }, // <-- NEW ITEM
  { name: "Add Area", icon: faLocationDot, href: "/areas" },
  { name: "Add Person", icon: faUserPlus, href: "/persons" },
  { name: "Remove Person", icon: faUserMinus, href: "/remove-person" },
  { name: "Update Record", icon: faPenToSquare, href: "/update-record" },
  { name: "Find Record", icon: faSearch, href: "/searchperson" },
  { name: "Find Person Record", icon: faClipboardList, href: "/find-person" },
  { name: "Report Menu", icon: faFileLines, href: "/ReportMenu" },
  { name: "Cash Received", icon: faReceipt, href: "/debitNote" },
];

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white shadow-xl border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Management</h2>
        <p className="text-sm text-gray-500 mt-1">Control Center</p>
      </div>
      <nav className="mt-6">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="flex items-center px-6 py-3 text-black hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 border-l-4 border-transparent hover:border-blue-500"
          >
            <FontAwesomeIcon icon={item.icon} className="mr-3 text-lg" />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
