"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Download, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

export function MemoListCard({ 
  title, 
  icon: Icon, 
  memos = [], 
  onCreateClick, 
  onEditClick, 
  onDeleteClick,
  onDownloadClick,
  emptyMessage = "No memos yet",
  color = "blue"
}) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (memo) => {
    if (!window.confirm(`Are you sure you want to delete ${memo.memoNumber}?`)) {
      return;
    }

    setDeletingId(memo._id);
    try {
      await onDeleteClick(memo);
      toast.success("Memo deleted successfully");
    } catch (error) {
      toast.error("Failed to delete memo");
    } finally {
      setDeletingId(null);
    }
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700",
      badge: "bg-blue-100 text-blue-800",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      button: "bg-green-600 hover:bg-green-700",
      badge: "bg-green-100 text-green-800",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Card className={`border-2 ${colors.border}`}>
      <CardHeader className={colors.bg}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${colors.badge} rounded-lg`}>
              <Icon className={`h-6 w-6 ${colors.text}`} />
            </div>
            <div>
              <CardTitle className={`text-xl ${colors.text}`}>{title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {memos.length} {memos.length === 1 ? 'memo' : 'memos'}
              </p>
            </div>
          </div>
          <Button onClick={onCreateClick} className={colors.button}>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {memos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memos.map((memo) => (
              <div
                key={memo._id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={colors.badge}>
                      {memo.memoNumber}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {formatDate(memo.createdAt, "dd MMM yyyy")}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Client:</span>
                      <span className="ml-2 font-medium">
                        {memo.clientId?.name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(memo.amount || memo.balanceAmount || 0)}
                      </span>
                    </div>
                    {memo.paymentMode && (
                      <div>
                        <span className="text-gray-600">Mode:</span>
                        <span className="ml-2 font-medium capitalize">
                          {memo.paymentMode}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Created by:</span>
                      <span className="ml-2 font-medium">
                        {memo.createdBy?.name || "System"}
                      </span>
                    </div>
                  </div>

                  {memo.remarks && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {memo.remarks}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownloadClick(memo)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditClick(memo)}
                    className="text-indigo-600 hover:text-indigo-800"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(memo)}
                    disabled={deletingId === memo._id}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    {deletingId === memo._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
