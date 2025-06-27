/**
 * Utility functions for handling MongoDB data structures
 */

/**
 * Extract string ID from MongoDB ObjectId or regular string ID
 * Handles both {$oid: "string"} format and plain string IDs
 */
export function extractId(id: any): string | undefined {
  if (!id) return undefined;
  
  // If it's already a string, return it
  if (typeof id === 'string') return id;
  
  // If it's a MongoDB ObjectId with $oid property
  if (typeof id === 'object' && id.$oid) {
    return id.$oid;
  }
  
  // If it's an object, try to convert to string
  if (typeof id === 'object') {
    return id.toString();
  }
  
  return String(id);
}

/**
 * Get a unique key for React components from MongoDB documents
 * Tries _id, then id, then falls back to index
 */
export function getUniqueKey(item: any, index: number, prefix: string = 'item'): string {
  const _id = extractId(item._id);
  const id = extractId(item.id);
  
  return _id || id || `${prefix}-${index}`;
}