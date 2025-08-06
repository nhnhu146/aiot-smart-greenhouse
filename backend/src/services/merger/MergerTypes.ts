export interface MergeStatistics {
	totalDuplicates: number
	mergedRecords: number
	deletedRecords: number
	processedGroups: number
}

export interface MergeOptions {
	exactDuplicatesOnly?: boolean
	timeWindowMs?: number
	preserveOriginal?: boolean
}

export interface DocumentGroup {
	_id: any
	docs: any[]
	count: number
}
