
"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";

import { 
  DollarSign, 
  ShoppingCart, 
  LineChart, 
  Wallet, 
  Eye 
} from "lucide-react";

const metricsData = [
  {
    id: 1,
    title: "Programs",
    value: "1,782",
    trend: "11.01%",
    trendType: "up",
    Icon: GroupIcon,
  },
  {
    id: 2,
    title: "Membership-Plan",
    value: "5,359",
    trend: "9.05%",
    trendType: "down",
    Icon: BoxIconLine,
  },
  {
    id: 3,
    title: "Recipes",
    value: "3,782",
    trend: "15.32%",
    trendType: "up",
    Icon: DollarSign,
  },
  {
    id: 4,
    title: "Services",
    value: "4,204",
    trend: "4.12%",
    trendType: "down",
    Icon: ShoppingCart,
  },
  {
    id: 5,
    title: "Faqs",
    value: "2,782",
    trend: "1.05%",
    trendType: "up",
    Icon: LineChart,
  },
  {
    id: 6,
    title: "Trainers",
    value: "6,782",
    trend: "2.40%",
    trendType: "down",
    Icon: Wallet,
  },
  {
    id: 7,
    title: "Page Views",
    value: "124,592",
    trend: "24.12%",
    trendType: "up",
    Icon: Eye,
  },
];

export const EcommerceMetrics = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metricsData.map((metric) => {
        const isUp = metric.trendType === "up";

        return (
          <div 
            key={metric.id} 
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <metric.Icon className="text-gray-800 size-6 dark:text-white/90" />
            </div>

            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {metric.title}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {metric.value}
                </h4>
              </div>
              
              <Badge color={isUp ? "success" : "error"}>
                {isUp ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon className="text-error-500" />
                )}
                {metric.trend}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};

