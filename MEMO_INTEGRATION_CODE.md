# Memo Integration Code for Trip View Page

## Add these imports at the top of frontend/app/trips/view/[id]/page.js:

```javascript
import { MemoListCard } from "@/components/memos/memo-list-card";
import { MemoFormDialog } from "@/components/memos/memo-form-dialog";
import { memosApi } from "@/lib/api";
import { Memo, FileText } from "lucide-react";
```

## Add these state variables in the component:

```javascript
// Memo states
const [collectionMemos, setCollectionMemos] = useState([]);
const [balanceMemos, setBalanceMemos] = useState([]);
const [showCollectionMemoDialog, setShowCollectionMemoDialog] = useState(false);
const [showBalanceMemoDialog, setShowBalanceMemoDialog] = useState(false);
const [editingCollectionMemo, setEditingCollectionMemo] = useState(null);
const [editingBalanceMemo, setEditingBalanceMemo] = useState(null);
const [memoLoading, setMemoLoading] = useState(false);
```

## Add these handler functions:

```javascript
// Fetch memos
const fetchMemos = async () => {
  try {
    const [collectionRes, balanceRes] = await Promise.all([
      memosApi.getAllCollectionMemos(params.id),
      memosApi.getAllBalanceMemos(params.id),
    ]);
    setCollectionMemos(collectionRes.data.memos || []);
    setBalanceMemos(balanceRes.data.memos || []);
  } catch (error) {
    console.error("Failed to fetch memos:", error);
  }
};

// Collection Memo Handlers
const handleCreateCollectionMemo = async (data) => {
  setMemoLoading(true);
  try {
    await memosApi.createCollectionMemo(params.id, data);
    toast.success("Collection memo created successfully");
    setShowCollectionMemoDialog(false);
    fetchMemos();
  } catch (error) {
    toast.error("Failed to create collection memo");
  } finally {
    setMemoLoading(false);
  }
};

const handleUpdateCollectionMemo = async (data) => {
  setMemoLoading(true);
  try {
    await memosApi.updateCollectionMemo(params.id, editingCollectionMemo._id, data);
    toast.success("Collection memo updated successfully");
    setShowCollectionMemoDialog(false);
    setEditingCollectionMemo(null);
    fetchMemos();
  } catch (error) {
    toast.error("Failed to update collection memo");
  } finally {
    setMemoLoading(false);
  }
};

const handleDeleteCollectionMemo = async (memo) => {
  try {
    await memosApi.deleteCollectionMemo(params.id, memo._id);
    fetchMemos();
  } catch (error) {
    throw error;
  }
};

const handleDownloadCollectionMemo = (memo) => {
  // TODO: Implement PDF download
  toast.info("PDF download coming soon");
};

// Balance Memo Handlers
const handleCreateBalanceMemo = async (data) => {
  setMemoLoading(true);
  try {
    await memosApi.createBalanceMemo(params.id, data);
    toast.success("Balance memo created successfully");
    setShowBalanceMemoDialog(false);
    fetchMemos();
  } catch (error) {
    toast.error("Failed to create balance memo");
  } finally {
    setMemoLoading(false);
  }
};

const handleUpdateBalanceMemo = async (data) => {
  setMemoLoading(true);
  try {
    await memosApi.updateBalanceMemo(params.id, editingBalanceMemo._id, data);
    toast.success("Balance memo updated successfully");
    setShowBalanceMemoDialog(false);
    setEditingBalanceMemo(null);
    fetchMemos();
  } catch (error) {
    toast.error("Failed to update balance memo");
  } finally {
    setMemoLoading(false);
  }
};

const handleDeleteBalanceMemo = async (memo) => {
  try {
    await memosApi.deleteBalanceMemo(params.id, memo._id);
    fetchMemos();
  } catch (error) {
    throw error;
  }
};

const handleDownloadBalanceMemo = (memo) => {
  // TODO: Implement PDF download
  toast.info("PDF download coming soon");
};
```

## Add useEffect to fetch memos:

```javascript
useEffect(() => {
  if (trip) {
    fetchMemos();
  }
}, [trip]);
```

## Add this JSX in the render (after POD section):

```jsx
{/* Memos Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  {/* Collection Memos */}
  <MemoListCard
    title="Collection Memos"
    icon={Memo}
    memos={collectionMemos}
    onCreateClick={() => {
      setEditingCollectionMemo(null);
      setShowCollectionMemoDialog(true);
    }}
    onEditClick={(memo) => {
      setEditingCollectionMemo(memo);
      setShowCollectionMemoDialog(true);
    }}
    onDeleteClick={handleDeleteCollectionMemo}
    onDownloadClick={handleDownloadCollectionMemo}
    emptyMessage="No collection memos yet"
    color="blue"
  />

  {/* Balance Memos */}
  <MemoListCard
    title="Balance Memos"
    icon={FileText}
    memos={balanceMemos}
    onCreateClick={() => {
      setEditingBalanceMemo(null);
      setShowBalanceMemoDialog(true);
    }}
    onEditClick={(memo) => {
      setEditingBalanceMemo(memo);
      setShowBalanceMemoDialog(true);
    }}
    onDeleteClick={handleDeleteBalanceMemo}
    onDownloadClick={handleDownloadBalanceMemo}
    emptyMessage="No balance memos yet"
    color="green"
  />
</div>

{/* Collection Memo Dialog */}
<MemoFormDialog
  open={showCollectionMemoDialog}
  onClose={() => {
    setShowCollectionMemoDialog(false);
    setEditingCollectionMemo(null);
  }}
  onSubmit={editingCollectionMemo ? handleUpdateCollectionMemo : handleCreateCollectionMemo}
  clients={trip?.clients?.map(c => c.client) || []}
  type="collection"
  editData={editingCollectionMemo}
  isLoading={memoLoading}
/>

{/* Balance Memo Dialog */}
<MemoFormDialog
  open={showBalanceMemoDialog}
  onClose={() => {
    setShowBalanceMemoDialog(false);
    setEditingBalanceMemo(null);
  }}
  onSubmit={editingBalanceMemo ? handleUpdateBalanceMemo : handleCreateBalanceMemo}
  clients={trip?.clients?.map(c => c.client) || []}
  type="balance"
  editData={editingBalanceMemo}
  isLoading={memoLoading}
/>
```

## Summary

This implementation provides:
- ✅ Multiple memos per trip
- ✅ Create, Edit, Delete operations
- ✅ Sequential memo numbers (CM000001, BM000001)
- ✅ Creator information tracking
- ✅ Date tracking (created/updated)
- ✅ Beautiful UI with proper styling
- ✅ Confirmation dialogs
- ✅ Toast notifications
- ✅ Loading states

## Next Steps:
1. Copy the integration code to trip view page
2. Test create/edit/delete operations
3. Implement PDF download functionality (optional)
