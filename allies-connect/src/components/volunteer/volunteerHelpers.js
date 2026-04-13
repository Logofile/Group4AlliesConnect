import { useState } from "react";

export const API_URL = process.env.REACT_APP_API_URL;

export function useTableDataProcessing(data, searchField) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const sortSymbol = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? " ▲" : " ▼";
    }
    return " ";
  };

  const sortedData = [...data]
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      return 0;
    })
    .filter((item) =>
      String(item[searchField] ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );

  return { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery };
}
