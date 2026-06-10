import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Beaker,
  CheckCircle2,
  ClipboardList,
  Database,
  Droplets,
  Factory,
  FileSearch,
  Flame,
  Gauge,
  ListChecks,
  Microscope,
  ScanSearch,
  Search,
  Shield,
  Sparkles,
  Waves,
} from 'lucide-react';
import { getKnowledgeBaseStats, getReferencesForSection, searchKnowledgeBase } from './knowledgeBase';
import './App.css';

const standards = {
  electronics: {
    name: '电子工业演示规则',
    code: 'HJ1253-2022',
    cod: { direct: 80, unit: 'mg/L' },
    ammoniaNitrogen: { direct: 15, unit: 'mg/L' },
    totalPhosphorus: { direct: 1.5, unit: 'mg/L' },
    totalNitrogen: { direct: 20, unit: 'mg/L' },
    ph: { min: 6, max: 9 },
    ss: { direct: 50, unit: 'mg/L' },
  },
  battery: {
    name: '电池工业演示规则',
    code: 'HJ1204-2021',
    cod: { direct: 70, unit: 'mg/L' },
    ammoniaNitrogen: { direct: 12, unit: 'mg/L' },
    totalPhosphorus: { direct: 1.0, unit: 'mg/L' },
    totalNitrogen: { direct: 18, unit: 'mg/L' },
    ph: { min: 6, max: 9 },
    ss: { direct: 40, unit: 'mg/L' },
  },
  printing: {
    name: '印刷工业演示规则',
    code: 'HJ1246-2022',
    cod: { direct: 90, unit: 'mg/L' },
    ammoniaNitrogen: { direct: 18, unit: 'mg/L' },
    totalPhosphorus: { direct: 2.0, unit: 'mg/L' },
    totalNitrogen: { direct: 22, unit: 'mg/L' },
    ph: { min: 6, max: 9 },
    ss: { direct: 55, unit: 'mg/L' },
  },
};

const enterpriseFields = [
  { name: 'cod', label: 'COD（mg/L）', placeholder: '例：65', icon: Beaker },
  { name: 'ammoniaNitrogen', label: '氨氮（mg/L）', placeholder: '例：12', icon: Droplets },
  { name: 'totalPhosphorus', label: '总磷（mg/L）', placeholder: '例：1.2', icon: Waves },
  { name: 'totalNitrogen', label: '总氮（mg/L）', placeholder: '例：8', icon: Gauge },
  { name: 'ph', label: 'pH值', placeholder: '例：6.8', icon: Microscope },
  { name: 'ss', label: 'SS（mg/L）', placeholder: '例：35', icon: Flame },
];

const defaultDraft = `6.3 采样监测方法严格按照国家污水监测技术标准执行，采样人员、化验人员持证上岗，操作流程标准化，数据记录规范化。

7 应急排放与风险防控标准化要求

7.1 企业必须建设污水应急调节池与事故储水池，应对生产波动、设备故障、检修停产等突发水质超标风险。
7.2 发生水质超标、设施故障、污水外溢等突发环保事件，立即启动标准化应急预案，停止超标排污、开启应急储存，及时整改治理并上报生态环境管理部门。
7.3 定期开展环保应急演练，完善风险防控标准化措施，杜绝工业废水污染水体环境事件发生。

8 附则

8.1 本标准由企业标准化管理部门与环保管理部门共同负责解释、实施、监督与持续修订。
8.2 本标准自发布之日起正式实施，原有排污相关内部管理规定与本标准不一致的，以本标准化规范为准。`;

const auditChecklist = [
  '章节结构完整性检查',
  '内部逻辑冲突检测',
  '格式规范审查',
  '引用文件完整性检查',
];

const capabilityColumns = [
  {
    title: '企业端：合规审计',
    items: ['监测参数智能比对', '行业标准切换对比', '实时合规判定', '超标改进建议'],
  },
  {
    title: '监管端：标准审查',
    items: ['AI章节结构检查', '逻辑冲突智能检测', '格式规范自动审查', '引用文件完整性校验'],
  },
];

const auditTemplates = [
  {
    title: '章节结构检查',
    icon: ListChecks,
    accent: 'blue',
    items: [
      {
        article: '第5章',
        tag: '章节缺失',
        severity: 'critical',
        problem: '缺少“试验方法”章节',
        suggestion:
          '建议补充第5章“试验方法”，包含监测方法、采样要求、质量控制等内容，参考行业自行监测技术指南中的监测方案章节。',
      },
      {
        article: '第7章',
        tag: '章节缺失',
        severity: 'warning',
        problem: '缺少“实施与监督”章节',
        suggestion: '建议补充第7章“实施与监督”，明确标准的实施日期、过渡期安排及监督管理要求。',
      },
    ],
  },
  {
    title: '冲突检测',
    icon: ScanSearch,
    accent: 'rose',
    items: [
      {
        article: '表1 vs 第4.2条',
        tag: '内容冲突',
        severity: 'critical',
        problem: '排放要求描述前后不一致',
        suggestion: '建议统一正文与表格中的限值口径，避免企业执行出现双重解释。',
      },
      {
        article: '第3.1条',
        tag: '术语冲突',
        severity: 'warning',
        problem: '“间接排放”定义与后文适用场景存在偏差',
        suggestion: '建议补充排放对象、接管条件及适用行业说明，减少歧义。',
      },
      {
        article: '第6.4条',
        tag: '描述不统一',
        severity: 'minor',
        problem: '同一监测频次在正文与备注中的表述粒度不同',
        suggestion: '建议统一使用“日监测 / 周监测 / 月监测”等规范表达，避免执行层误读。',
      },
    ],
  },
  {
    title: '格式规范检查',
    icon: ClipboardList,
    accent: 'sky',
    items: [
      {
        article: '表2 章节层级',
        tag: '格式瑕疵',
        severity: 'warning',
        problem: '表头编号格式与行业标准常见模板不一致',
        suggestion: '建议统一采用“章-条-款”格式，并保持标题字号、行距和缩进一致。',
      },
      {
        article: '第4.3条',
        tag: '格式瑕疵',
        severity: 'minor',
        problem: '图表编号和说明文缺少统一样式',
        suggestion: '建议为全部图表补全编号、标题和来源说明。',
      },
    ],
  },
  {
    title: '引用文件检查',
    icon: FileSearch,
    accent: 'violet',
    items: [
      {
        article: '第4.1条',
        tag: '缺失引用',
        severity: 'critical',
        problem: '提及“水质采样技术”但未引用相关标准',
        suggestion: '建议在“规范性引用文件”章节中补全与采样、pH测定和质量控制有关的标准编号。',
      },
      {
        article: '第5.2条',
        tag: '缺失引用',
        severity: 'critical',
        problem: '提及“实验室质量控制”但未引用相关标准',
        suggestion: '建议增加实验室能力与质量控制相关的规范性引用文件。',
      },
      {
        article: '附录A',
        tag: '缺失引用',
        severity: 'critical',
        problem: '监测设备校准要求未关联计量规范性文件',
        suggestion: '建议补充与在线监测设备校准相关的规范性引用文件，并明确校准周期和记录要求。',
      },
      {
        article: '第2章',
        tag: '引用格式',
        severity: 'minor',
        problem: '规范性引用文件缺少发布日期或版本说明',
        suggestion: '建议按“标准号 + 名称 + 年份”形式补全引用信息，便于后续版本管理。',
      },
    ],
  },
];

const toneMap = {
  pass: {
    className: 'tone-pass',
    label: '达标',
    icon: CheckCircle2,
  },
  warning: {
    className: 'tone-warning',
    label: '临界',
    icon: AlertTriangle,
  },
  fail: {
    className: 'tone-fail',
    label: '超标',
    icon: AlertCircle,
  },
  critical: {
    className: 'tone-fail',
    label: '严重',
    icon: AlertCircle,
  },
  info: {
    className: 'tone-info',
    label: '提示',
    icon: CheckCircle2,
  },
  minor: {
    className: 'tone-info',
    label: '轻微',
    icon: CheckCircle2,
  },
};

function ReferenceList({ title, documents }) {
  if (!documents.length) {
    return null;
  }

  return (
    <div className="reference-block">
      <p className="reference-title">{title}</p>
      <div className="reference-list">
        {documents.map((document) => (
          <a
            key={document.id}
            className="reference-chip"
            href={document.relativePdfPath}
            target="_blank"
            rel="noreferrer"
          >
            <strong>{document.code}</strong>
            <span>{document.industry}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function KnowledgeBasePanel({ documents, loading, query, onQueryChange }) {
  const filteredDocuments = query ? searchKnowledgeBase(documents, query, 7) : documents.slice(0, 7);
  const stats = getKnowledgeBaseStats(documents);

  return (
    <article className="card kb-panel">
      <div className="section-heading">
        <div className="section-icon neutral-icon">
          <Database size={20} />
        </div>
        <div>
          <h2>工业排污知识库</h2>
          <p>已导入 PDF 标准文件，可作为垂直智能体的审查依据和引用来源。</p>
        </div>
      </div>

      <p className="kb-summary">
        {loading
          ? '知识库正在加载中...'
          : `当前已导入 ${stats.documentCount} 份工业排污相关标准，可作为审查依据和引用来源。`}
      </p>

      <div className="kb-doc-list">
        {loading && <p className="helper-text">正在加载标准库索引...</p>}
        {!loading &&
          filteredDocuments.map((document) => (
            <a
              key={document.id}
              className="kb-doc-card"
              href={document.relativePdfPath}
              target="_blank"
              rel="noreferrer"
            >
              <div className="kb-doc-head">
                <div>
                  <h3>{document.title}</h3>
                  <p>
                    {document.code} · {document.industry}
                  </p>
                </div>
                <span className="kb-tag">{document.pageCount}页</span>
              </div>
              <p className="kb-doc-scope">{document.scope}</p>
              <div className="kb-doc-tags">
                {document.keywords.slice(0, 4).map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            </a>
          ))}
        {!loading && !filteredDocuments.length && (
          <p className="helper-text">当前关键词没有命中结果，可以试试“监测方案”或“规范性引用文件”。</p>
        )}
      </div>

      <label className="field kb-search-field">
        <span>知识库检索</span>
        <div className="field-input">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索：监测方案、规范性引用文件、电子工业..."
          />
        </div>
      </label>
    </article>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('enterprise');
  const [formData, setFormData] = useState({
    standardCode: '',
    industryType: 'electronics',
    cod: '65',
    ammoniaNitrogen: '12',
    totalPhosphorus: '-2',
    totalNitrogen: '8',
    ph: '6.8',
    ss: '35',
  });
  const [enterpriseLoading, setEnterpriseLoading] = useState(false);
  const [enterpriseResult, setEnterpriseResult] = useState(null);
  const [draftText, setDraftText] = useState(defaultDraft);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [kbLoading, setKbLoading] = useState(true);
  const [kbQuery, setKbQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadKnowledgeBase() {
      try {
        const response = await fetch('/knowledge-base/standards-kb.json');
        const payload = await response.json();
        if (!cancelled) {
          setKnowledgeBase(payload.documents ?? []);
        }
      } catch {
        if (!cancelled) {
          setKnowledgeBase([]);
        }
      } finally {
        if (!cancelled) {
          setKbLoading(false);
        }
      }
    }

    loadKnowledgeBase();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentStandard = standards[formData.industryType];
  const selectedStandardCode = formData.standardCode || knowledgeBase[0]?.code || '';
  const selectedKnowledgeDoc =
    knowledgeBase.find((document) => document.code === selectedStandardCode) || knowledgeBase[0];
  const enterpriseReferences = selectedKnowledgeDoc ? [selectedKnowledgeDoc] : [];
  const canAnalyze = useMemo(
    () => enterpriseFields.every((field) => formData[field.name].trim()),
    [formData],
  );

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const analyzeEnterprise = () => {
    if (!canAnalyze) {
      return;
    }

    setEnterpriseLoading(true);
    setEnterpriseResult(null);

    const metrics = [
      {
        key: 'cod',
        name: 'COD',
        value: Number(formData.cod),
        limit: currentStandard.cod.direct,
        unit: currentStandard.cod.unit,
        icon: Beaker,
      },
      {
        key: 'ammoniaNitrogen',
        name: '氨氮',
        value: Number(formData.ammoniaNitrogen),
        limit: currentStandard.ammoniaNitrogen.direct,
        unit: currentStandard.ammoniaNitrogen.unit,
        icon: Droplets,
      },
      {
        key: 'totalPhosphorus',
        name: '总磷',
        value: Number(formData.totalPhosphorus),
        limit: currentStandard.totalPhosphorus.direct,
        unit: currentStandard.totalPhosphorus.unit,
        icon: Waves,
      },
      {
        key: 'totalNitrogen',
        name: '总氮',
        value: Number(formData.totalNitrogen),
        limit: currentStandard.totalNitrogen.direct,
        unit: currentStandard.totalNitrogen.unit,
        icon: Gauge,
      },
      {
        key: 'ph',
        name: 'pH值',
        value: Number(formData.ph),
        unit: '',
        range: currentStandard.ph,
        icon: Microscope,
      },
      {
        key: 'ss',
        name: 'SS',
        value: Number(formData.ss),
        limit: currentStandard.ss.direct,
        unit: currentStandard.ss.unit,
        icon: Flame,
      },
    ];

    const checks = metrics.map((metric) => {
      if (metric.range) {
        const withinRange = metric.value >= metric.range.min && metric.value <= metric.range.max;
        return {
          ...metric,
          percentage: withinRange ? 76 : 100,
          status: withinRange ? 'pass' : 'fail',
          message: withinRange
            ? `符合范围 ${metric.range.min}-${metric.range.max}`
            : `超出范围 ${metric.range.min}-${metric.range.max}`,
          limitLabel: `${metric.range.min}-${metric.range.max}`,
        };
      }

      const rawPercentage = metric.limit === 0 ? 0 : (metric.value / metric.limit) * 100;
      const status = rawPercentage <= 80 ? 'pass' : rawPercentage <= 100 ? 'warning' : 'fail';

      return {
        ...metric,
        percentage: Math.max(0, Math.min(rawPercentage, 130)),
        status,
        message:
          status === 'pass'
            ? `远低于演示阈值（${rawPercentage.toFixed(1)}%）`
            : status === 'warning'
              ? `临界达标（${rawPercentage.toFixed(1)}%）`
              : `超出演示阈值 ${(rawPercentage - 100).toFixed(1)}%`,
        limitLabel: `${metric.limit}`,
      };
    });

    const warnings = checks.filter((item) => item.status === 'warning');
    const failures = checks.filter((item) => item.status === 'fail');
    const overallCompliant = failures.length === 0;
    const standardLabel = selectedKnowledgeDoc
      ? `${selectedKnowledgeDoc.code} · ${selectedKnowledgeDoc.industry}`
      : currentStandard.name;
    const insight = overallCompliant
      ? warnings.length
        ? `整体合规，但 ${warnings.map((item) => item.name).join('、')} 已接近阈值。建议结合 ${standardLabel} 中的监测方案与记录要求，提升过程控制稳定性。`
        : `当前监测参数满足演示规则集，可进一步参照 ${standardLabel} 校验采样频次、记录方式和排放口管理要求。`
      : `发现 ${failures.length} 项风险指标：${failures
          .map((item) => item.name)
          .join('、')}。建议优先复核在线监测数据，并结合 ${standardLabel} 对采样、质量控制和信息记录部分进行补强。`;

    window.setTimeout(() => {
      setEnterpriseResult({
        overallCompliant,
        standardName: standardLabel,
        timestamp: new Date().toLocaleString('zh-CN'),
        checks,
        warnings,
        failures,
        insight,
      });
      setEnterpriseLoading(false);
    }, 900);
  };

  const runAudit = () => {
    setAuditLoading(true);
    setAuditResult(null);

    const normalizedText = draftText.replace(/\s+/g, '');
    const sections = auditTemplates.map((section) => ({
      ...section,
      references: getReferencesForSection(section.title, knowledgeBase),
      items: section.items.filter((item) => {
        if (item.article === '第5章') {
          return !normalizedText.includes('5试验方法');
        }

        if (item.article === '第7章') {
          return !normalizedText.includes('7实施与监督');
        }

        if (item.article === '第4.1条') {
          return normalizedText.includes('水质采样') && !normalizedText.includes('GB/T6920-1986');
        }

        if (item.article === '第5.2条') {
          return normalizedText.includes('实验室质量控制') || !normalizedText.includes('GB/T27025-2019');
        }

        return true;
      }),
    }));

    const allIssues = sections.flatMap((section) => section.items);
    const criticalCount = allIssues.filter((item) => item.severity === 'critical').length;
    const warningCount = allIssues.filter((item) => item.severity === 'warning').length;
    const minorCount = allIssues.filter(
      (item) => item.severity === 'minor' || item.severity === 'info',
    ).length;
    const score = Math.max(60, 100 - criticalCount * 4 - warningCount * 3 - minorCount);

    window.setTimeout(() => {
      setAuditResult({
        sections,
        summary: {
          total: allIssues.length,
          critical: criticalCount,
          warning: warningCount,
          minor: minorCount,
          score,
        },
      });
      setAuditLoading(false);
    }, 1100);
  };

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <main className="app-frame">
        <header className="hero-card">
          <div className="hero-brand">
            <div className="hero-logo">
              <Shield size={24} />
            </div>
            <div>
              <p className="hero-title">排污标准垂直智能体</p>
              <p className="hero-subtitle">工业排污核查 · 标准知识库 · 双向智能审查系统</p>
            </div>
          </div>

          <div className="hero-badges">
            <span className="badge badge-blue">基于SaC架构</span>
            <span className="badge badge-green">双向服务：企业+监管</span>
            <span className="badge badge-violet">
              {kbLoading ? '知识库加载中' : `知识库已导入 ${knowledgeBase.length} 份标准`}
            </span>
          </div>
        </header>

        <section className="tab-switcher" aria-label="功能切换">
          <button
            type="button"
            className={`tab-pill ${activeTab === 'enterprise' ? 'is-active enterprise' : ''}`}
            onClick={() => setActiveTab('enterprise')}
          >
            <Droplets size={18} />
            <span>企业合规审计</span>
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'standard' ? 'is-active standard' : ''}`}
            onClick={() => setActiveTab('standard')}
          >
            <ClipboardList size={18} />
            <span>标准智能审查</span>
          </button>
        </section>

        {activeTab === 'enterprise' ? (
          <section className="panel-stack">
            <article className="card">
              <div className="section-heading">
                <div className="section-icon enterprise-icon">
                  <Factory size={20} />
                </div>
                <div>
                  <h2>工业排污参数录入</h2>
                  <p>当前为前端演示规则集，正式审计时可结合已导入的行业标准库进行引用与扩展。</p>
                </div>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>知识库标准选择</span>
                  <select name="standardCode" value={selectedStandardCode} onChange={handleFieldChange}>
                    {knowledgeBase.map((document) => (
                      <option key={document.id} value={document.code}>
                        {document.code} · {document.industry}
                      </option>
                    ))}
                    {!knowledgeBase.length && <option>标准库载入中</option>}
                  </select>
                </label>

                <label className="field">
                  <span>演示规则行业</span>
                  <select name="industryType" value={formData.industryType} onChange={handleFieldChange}>
                    <option value="electronics">电子工业</option>
                    <option value="battery">电池工业</option>
                    <option value="printing">印刷工业</option>
                  </select>
                </label>

                {enterpriseFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <label key={field.name} className="field">
                      <span>{field.label}</span>
                      <div className="field-input">
                        <Icon size={16} />
                        <input
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleFieldChange}
                          placeholder={field.placeholder}
                          inputMode="decimal"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>

              <ReferenceList title="当前优先引用标准" documents={enterpriseReferences} />

              <button
                type="button"
                className="action-button action-enterprise"
                onClick={analyzeEnterprise}
                disabled={!canAnalyze || enterpriseLoading}
              >
                {enterpriseLoading ? '分析中...' : '开始合规审计'}
              </button>
            </article>

            {enterpriseLoading && (
              <article className="card empty-card">
                <div className="loading-mark">
                  <div className="spinner" />
                </div>
                <h3>等待审计结果</h3>
                <p>系统正在根据演示规则集与知识库上下文进行合规判断。</p>
              </article>
            )}

            {!enterpriseLoading && !enterpriseResult && (
              <article className="card empty-card">
                <div className="empty-icon">
                  <Droplets size={40} />
                </div>
                <h3>等待审计</h3>
                <p>请输入监测参数，系统将给出实时判断，并从标准库中补充参考依据。</p>
              </article>
            )}

            {enterpriseResult && !enterpriseLoading && (
              <>
                <article
                  className={`card status-card ${
                    enterpriseResult.overallCompliant ? 'status-success' : 'status-danger'
                  }`}
                >
                  <div className="status-head">
                    <div className="status-symbol">
                      {enterpriseResult.overallCompliant ? (
                        <CheckCircle2 size={28} />
                      ) : (
                        <AlertCircle size={28} />
                      )}
                    </div>
                    <div>
                      <h3>{enterpriseResult.overallCompliant ? '合规达标' : '存在超标风险'}</h3>
                      <p>
                        {enterpriseResult.standardName} · 审计时间 {enterpriseResult.timestamp}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="card">
                  <div className="section-heading">
                    <div className="section-icon neutral-icon">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <h2>指标详情</h2>
                      <p>自动比对演示阈值，并结合知识库行业标准给出参考方向。</p>
                    </div>
                  </div>

                  <div className="metric-list">
                    {enterpriseResult.checks.map((check) => {
                      const tone = toneMap[check.status];
                      const ToneIcon = tone.icon;
                      const CheckIcon = check.icon;

                      return (
                        <article key={check.key} className={`metric-card ${tone.className}`}>
                          <div className="metric-header">
                            <div className="metric-title">
                              <CheckIcon size={18} />
                              <strong>{check.name}</strong>
                            </div>
                            <span className="metric-badge">
                              <ToneIcon size={16} />
                              {tone.label}
                            </span>
                          </div>

                          <div className="metric-value-row">
                            <div>
                              <span className="metric-value">{check.value}</span>
                              {check.unit && <span className="metric-unit">{check.unit}</span>}
                            </div>
                            <span className="metric-limit">阈值 {check.limitLabel}</span>
                          </div>

                          <div className="metric-bar">
                            <span style={{ width: `${check.percentage}%` }} />
                          </div>

                          <p className="metric-message">{check.message}</p>
                        </article>
                      );
                    })}
                  </div>
                </article>

                <article className="card insight-card">
                  <div className="section-heading">
                    <div className="section-icon insight-icon">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h2>AI合规建议</h2>
                      <p>结合监测参数与已导入标准文件生成的审计意见。</p>
                    </div>
                  </div>

                  <p>{enterpriseResult.insight}</p>
                </article>
              </>
            )}

            <KnowledgeBasePanel
              documents={knowledgeBase}
              loading={kbLoading}
              query={kbQuery}
              onQueryChange={setKbQuery}
            />
          </section>
        ) : (
          <section className="panel-stack">
            <article className="card">
              <div className="section-heading">
                <div className="section-icon standard-icon">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h2>标准文稿审查</h2>
                  <p>当前支持文本模拟审查，已导入的工业排污标准库会作为审查依据和推荐引用来源。</p>
                </div>
              </div>

              <label className="field">
                <span>上传标准草稿</span>
                <textarea
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                  rows={14}
                />
              </label>
              <p className="helper-text">支持 Word、PDF 格式（当前前端演示版本仅支持文本模拟）</p>

              <section className="audit-checklist">
                <h3>智能审查项目</h3>
                <div className="checklist-grid">
                  {auditChecklist.map((item) => (
                    <div key={item} className="checklist-item">
                      <CheckCircle2 size={16} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <button
                type="button"
                className="action-button action-standard"
                onClick={runAudit}
                disabled={auditLoading}
              >
                {auditLoading ? 'AI审查中...' : '开始智能审查'}
              </button>
            </article>

            {auditResult && !auditLoading && (
              <>
                <article className="card">
                  <div className="section-heading">
                    <div className="section-icon neutral-icon">
                      <FileSearch size={20} />
                    </div>
                    <div>
                      <h2>审查总览</h2>
                      <p>从结构、冲突、格式和引用四个维度输出风险结果，并自动挂接知识库参考标准。</p>
                    </div>
                  </div>

                  <div className="summary-grid">
                    <div className="summary-item">
                      <strong>{auditResult.summary.total}</strong>
                      <span>问题总数</span>
                    </div>
                    <div className="summary-item danger">
                      <strong>{auditResult.summary.critical}</strong>
                      <span>严重问题</span>
                    </div>
                    <div className="summary-item warning">
                      <strong>{auditResult.summary.warning}</strong>
                      <span>中等问题</span>
                    </div>
                    <div className="summary-item info">
                      <strong>{auditResult.summary.minor}</strong>
                      <span>轻微问题</span>
                    </div>
                  </div>

                  <div className="score-banner">
                    <div>
                      <h3>综合评分</h3>
                      <p>建议：建议修改后再次审查</p>
                    </div>
                    <strong>{auditResult.summary.score}/100</strong>
                  </div>
                </article>

                {auditResult.sections.map((section) => {
                  const Icon = section.icon;

                  return (
                    <article key={section.title} className="card issue-section">
                      <div className="section-heading compact">
                        <div className={`section-icon ${section.accent}-icon`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <h2>
                            {section.title}（{section.items.length}）
                          </h2>
                        </div>
                      </div>

                      <ReferenceList title="知识库推荐依据" documents={section.references} />

                      <div className="issue-list">
                        {section.items.map((item) => {
                          const tone = toneMap[item.severity];
                          const ToneIcon = tone.icon;

                          return (
                            <article key={`${section.title}-${item.article}`} className={`issue-card ${tone.className}`}>
                              <div className="issue-meta">
                                <div className="issue-tagline">
                                  <ToneIcon size={16} />
                                  <strong>{item.article}</strong>
                                  <span>{item.tag}</span>
                                </div>
                              </div>
                              <p>
                                <strong>问题：</strong>
                                {item.problem}
                              </p>
                              <p>
                                <strong>建议：</strong>
                                {item.suggestion}
                              </p>
                            </article>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}

                <article className="card capability-card">
                  <div className="section-heading">
                    <div className="section-icon enterprise-icon">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h2>平台双向服务能力</h2>
                      <p>为企业自查与监管审查提供统一的标准化智能入口。</p>
                    </div>
                  </div>

                  <div className="capability-grid">
                    {capabilityColumns.map((column) => (
                      <div key={column.title} className="capability-column">
                        <h3>{column.title}</h3>
                        <ul>
                          {column.items.map((item) => (
                            <li key={item}>
                              <ArrowRight size={14} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              </>
            )}

            <KnowledgeBasePanel
              documents={knowledgeBase}
              loading={kbLoading}
              query={kbQuery}
              onQueryChange={setKbQuery}
            />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
