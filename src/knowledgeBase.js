const referenceQueryMap = {
  '章节结构检查': '监测方案 信息记录 报告',
  '冲突检测': '术语 定义 监测频次 监测方案',
  '格式规范检查': '信息记录 报告 格式 监测方案',
  '引用文件检查': '规范性引用文件 采样 质量控制',
};

function tokenize(query) {
  return query
    .split(/[\s、，。；：,./]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function searchKnowledgeBase(documents, query, limit = 4) {
  const terms = tokenize(query);

  return documents
    .map((document) => {
      const haystack = `${document.searchText} ${document.preview} ${document.scope}`;
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { ...document, score };
    })
    .filter((document) => document.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, limit);
}

export function getKnowledgeBaseStats(documents) {
  return {
    documentCount: documents.length,
    totalPages: documents.reduce((sum, document) => sum + document.pageCount, 0),
    industries: [...new Set(documents.map((document) => document.industry))].length,
  };
}

export function getReferencesForSection(sectionTitle, documents) {
  const query = referenceQueryMap[sectionTitle] || sectionTitle;
  return searchKnowledgeBase(documents, query, 2);
}
