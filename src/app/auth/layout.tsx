import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Settings,
  Search,
  CheckSquare,
  Clock,
  ChevronDown,
  Home,
  Truck,
  Box,
} from "lucide-react";

import fastraLogo from "../../../public/fastraLogo.png";

const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen border">
      <div
        className="flex-1 overflow-hidden"
        // style={
        //   {
        //     backgroundImage: "url('/images/bg.svg')",
        //   }
        // }
        aria-hidden="true"
      >
        {/* Mobile Logo */}
        <div className="lg:hidden fixed flex items-center gap-3 w-25 h-10 m-4">
          <Image
            src={fastraLogo}
            alt="Fastra"
            width={1000}
            height={1000}
            className="object-fill w-full h-auto"
          />
        </div>

        <div className="min-h-screen relative hidden lg:flex flex-col p-6 md:p-12 lg:pl-20 ">
          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center gap-3 w-25 h-10 mb-8">
            <Image
              src={fastraLogo}
              alt="Fastra"
              width={1000}
              height={1000}
              className="object-fill w-full h-auto"
            />
          </div>

          {/* Hero heading */}
          <div className="hidden lg:block mb-12 max-w-lg space-y-4">
            <h1
              className="font-[Inter] text-2xl leading-tight font-bold text-gray-900 "
              style={{ lineHeight: 1.12 }}
            >
              Maximize the Planning of Projects with{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#3B7CED] to-[#2143a9]">
                Fastra Suite
              </span>
            </h1>

            <p className="text-sm text-gray-600 max-w-md -mt-2">
              Scale Without Limits: Automate, Integrate, and Secure Your Project
              Operations
            </p>

            <Button
              variant="default"
              className="cursor-pointer transition-shadow text-xs"
            >
              <span className="text-xs">Contact Us</span>
            </Button>
          </div>

          {/* Dashboard Preview Mockup - REPLACING the old Card */}
          <div className="hidden lg:flex relative flex-1 mt-4">
            <div className="absolute left-0 top-0 -right-25 -bottom-50 bg-[#F8F9FB] rounded-tl-2xl shadow-2xl overflow-hidden flex flex-row border border-gray-200">
              {/* Mock Sidebar */}
              <div className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-6 space-y-8">
                <div className="p-2 text-blue-600">
                  <LayoutDashboard size={20} />
                </div>
                <div className="p-2 text-gray-400">
                  <Home size={20} />
                </div>
                <div className="p-2 text-gray-400">
                  <FileText size={20} />
                </div>
                <div className="p-2 text-gray-400">
                  <Box size={20} />
                </div>
                <div className="p-2 text-gray-400">
                  <Package size={20} />
                </div>
                <div className="p-2 text-gray-400">
                  <Users size={20} />
                </div>
                <div className="p-2 text-gray-400">
                  <Truck size={20} />
                </div>
                <div className="mt-auto p-2 text-gray-400">
                  <Settings size={20} />
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {/* Top Nav */}
                <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
                  <div className="flex items-center gap-8">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Purchase
                    </h2>
                    <div className="flex gap-6 text-sm">
                      <span className="text-blue-600 font-medium border-b-2 border-blue-600 py-5">
                        Purchase Requests
                      </span>
                      <span className="text-gray-500 py-5">RFQs</span>
                      <span className="text-gray-500 py-5">
                        Purchase Orders
                      </span>
                      <span className="text-gray-500 py-5 flex items-center gap-1">
                        Vendors <ChevronDown size={14} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breadcrumb */}
                <div className="px-8 py-4 text-xs text-gray-400">
                  Home <span className="mx-2">›</span>{" "}
                  <span className="text-gray-600">Purchase</span>
                </div>

                {/* Stats Row */}
                <div className="px-8 pb-6 grid grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="text-blue-500" size={16} />
                      <span className="text-sm text-blue-500 font-medium">
                        Draft
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">12</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="text-green-500" size={16} />
                      <span className="text-sm text-green-500 font-medium">
                        Approved
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">12</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-yellow-500" size={16} />
                      <span className="text-sm text-yellow-500 font-medium">
                        Pending
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-500">12</div>
                  </div>
                </div>

                {/* Table Section */}
                <div className="px-8 flex-1 bg-white">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">
                      Purchase Requests
                    </h3>
                    <div className="relative max-w-sm">
                      <Search
                        className="absolute left-3 top-2.5 text-gray-300"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Search"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="py-3 pl-2 w-10">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="py-3 font-medium">Request ID</th>
                        <th className="py-3 font-medium">Product Name</th>
                        <th className="py-3 font-medium">QTY</th>
                        <th className="py-3 font-medium">Amount</th>
                        <th className="py-3 font-medium">Requester</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <tr
                          key={item}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="py-4 pl-2">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="py-4 text-gray-600">PR00001</td>
                          <td className="py-4 text-gray-800 font-medium">
                            Laptop, Keyboard & Mouse
                          </td>
                          <td className="py-4 text-gray-600">4</td>
                          <td className="py-4 text-gray-600">2,600,000</td>
                          <td className="py-4 text-gray-600">
                            Firstname Lastname
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:w-1/2 lg:border">{children}</div>
    </div>
  );
};

export default AuthLayout;
