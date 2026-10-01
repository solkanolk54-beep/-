/**
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية
 * Kareema - Smart Supply Chain & Fair Price Monitoring System
 * 
 * Principal Architect & Senior Full-Stack Engineer Implementation
 */

import React, { useState } from 'react';
import { UserRole, Commodity, ShipmentPassport, CitizenReport, InspectionMission, AuditLogEntry, AnomalyAlert } from './types';
import { 
  INITIAL_COMMODITIES, 
  INITIAL_SHIPMENTS, 
  INITIAL_CITIZEN_REPORTS, 
  INITIAL_INSPECTOR_MISSIONS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_ANOMALIES 
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { FarmToForkModule } from './components/modules/FarmToForkModule';
import { SupplyChainPassportModule } from './components/modules/SupplyChainPassportModule';
import { CitizenReportingModule } from './components/modules/CitizenReportingModule';
import { InspectorTaskingModule } from './components/modules/InspectorTaskingModule';
import { AiAnalyticsModule } from './components/modules/AiAnalyticsModule';
import { AdvancedExecutionWorkbench } from './components/modules/AdvancedExecutionWorkbench';
import { ArchitectureDeliverablesView } from './components/deliverables/ArchitectureDeliverablesView';
import { NewReportModal } from './components/modals/NewReportModal';
import { PassportDetailModal } from './components/modals/PassportDetailModal';
import { CheckCircle2, ShieldCheck, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('farm-to-fork');
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Core application data state
  const [commodities, setCommodities] = useState<Commodity[]>(INITIAL_COMMODITIES);
  const [shipments, setShipments] = useState<ShipmentPassport[]>(INITIAL_SHIPMENTS);
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_CITIZEN_REPORTS);
  const [missions, setMissions] = useState<InspectionMission[]>(INITIAL_INSPECTOR_MISSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>(INITIAL_ANOMALIES);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedCommodityForReport, setSelectedCommodityForReport] = useState<Commodity | undefined>(undefined);
  const [selectedShipmentForModal, setSelectedShipmentForModal] = useState<ShipmentPassport | null>(null);
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>(INITIAL_COMMODITIES[0].id);

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Submit a new citizen report
  const handleCreateReport = (newReportData: Partial<CitizenReport>) => {
    const report: CitizenReport = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      ticketNumber: newReportData.ticketNumber || `KRM-TKT-${Date.now().toString().slice(-6)}`,
      commodityId: newReportData.commodityId || 'potato-table',
      commodityNameAr: newReportData.commodityNameAr || 'بطاطا استهلاك',
      observedPrice: newReportData.observedPrice || 90,
      ceilingPrice: newReportData.ceilingPrice || 75,
      inflationDeltaPct: newReportData.inflationDeltaPct || 20,
      storeName: newReportData.storeName || 'محل تجزئة',
      storeAddress: newReportData.storeAddress || 'وسط المدينة',
      wilaya: newReportData.wilaya || 'الجزائر العاصمة',
      baladiya: newReportData.baladiya || 'سيدي امحمد',
      coordinates: newReportData.coordinates || [36.75, 3.05],
      receiptImageUrl: newReportData.receiptImageUrl,
      reporterBadge: newReportData.reporterBadge || 'مواطن يقظ #501',
      status: newReportData.status || 'triaged',
      createdAt: 'الآن',
      slaMinutesRemaining: newReportData.slaMinutesRemaining || 120,
    };

    setReports([report, ...reports]);

    // Record immutable audit entry
    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionAr: `تسجيل بلاغ مواطن موثق بـ GPS ضد (${report.storeName}) لتجاوز سعر (${report.commodityNameAr}) بنسبة +${report.inflationDeltaPct}%`,
      actorRole: 'citizen',
      actorId: 'CIT-AUTH-SESSION',
      targetEntity: report.ticketNumber,
      blockHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      previousHash: auditLogs[0]?.blockHash || '0x0000000000000000000000',
      status: 'immutable_verified',
    };
    setAuditLogs([newLog, ...auditLogs]);

    showToast(`تم إيداع البلاغ بنجاح برقم التذكرة ${report.ticketNumber} وإخطار مصالح الرقابة فوراً.`, 'success');
  };

  // Resolve a report with official inspector fine
  const handleResolveReport = (reportId: string, resolutionNotes: string, fineAmountDzd?: number) => {
    setReports(reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'verified_violation',
          inspectorNotes: resolutionNotes,
          slaMinutesRemaining: 0,
        };
      }
      return r;
    }));

    // Record in immutable ledger
    const targetReport = reports.find((r) => r.id === reportId);
    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionAr: `تحرير محضر إثبات مخالفة ضد (${targetReport?.storeName}) وتغريم بمبلغ ${fineAmountDzd?.toLocaleString()} دج طبقا للمرسوم التنفيذي وقانون 21-15`,
      actorRole: 'inspector',
      actorId: 'INSP-16-042',
      targetEntity: targetReport?.ticketNumber || reportId,
      blockHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      previousHash: auditLogs[0]?.blockHash || '0x0000000000000000000000',
      status: 'tamper_proof',
    };
    setAuditLogs([newLog, ...auditLogs]);

    showToast(`تم تسجيل المحضر وتوقيع الغرامة في الدفتر الرقمي المشفر.`, 'success');
  };

  // Verify and match a shipment
  const handleVerifyShipment = (shipmentId: string) => {
    setShipments(shipments.map((s) => {
      if (s.id === shipmentId) {
        return {
          ...s,
          status: 'delivered',
          deviationDetected: false,
        };
      }
      return s;
    }));

    showToast(`تمت المصادقة على شحنة الإمداد وإغلاق بطاقة السير بنجاح.`, 'success');
  };

  // Create a new shipment passport
  const handleCreateShipment = (newShipment: Partial<ShipmentPassport>) => {
    setShipments([newShipment as ShipmentPassport, ...shipments]);
    showToast(`تم توليد جواز السفر الرقمي ورمز QR للشحنة بنجاح.`, 'success');
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${lang === 'ar' ? 'font-sans' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sovereign Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReportModal={() => {
          setSelectedCommodityForReport(undefined);
          setIsReportModalOpen(true);
        }}
        lang={lang}
        onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      />

      {/* Floating System Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500/60 shadow-2xl shadow-emerald-950/60 text-xs text-white max-w-lg animate-bounce">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Tab 0: Execution Workbench for 4 Modules */}
        {activeTab === 'execution-workbench' && (
          <AdvancedExecutionWorkbench
            commodities={commodities}
            shipments={shipments}
            reports={reports}
          />
        )}

        {/* Tab 1: Farm to Fork Price Transparency */}
        {activeTab === 'farm-to-fork' && (
          <FarmToForkModule
            commodities={commodities}
            selectedCommodityId={selectedCommodityId}
            onSelectCommodity={setSelectedCommodityId}
            onOpenReportForCommodity={(comm) => {
              setSelectedCommodityForReport(comm);
              setIsReportModalOpen(true);
            }}
          />
        )}

        {/* Tab 2: Supply Chain Passport & QR Traceability */}
        {activeTab === 'passport-trace' && (
          <SupplyChainPassportModule
            shipments={shipments}
            currentRole={currentRole}
            onOpenShipmentDetail={(shp) => setSelectedShipmentForModal(shp)}
            onCreateNewShipment={handleCreateShipment}
          />
        )}

        {/* Tab 3: Crowdsourced Citizen Reporting & Map */}
        {activeTab === 'citizen-reporting' && (
          <CitizenReportingModule
            reports={reports}
            commodities={commodities}
            onOpenReportModal={() => {
              setSelectedCommodityForReport(undefined);
              setIsReportModalOpen(true);
            }}
          />
        )}

        {/* Tab 4: Inspector Tasking & Immutable Audit Ledger */}
        {activeTab === 'inspector-tasking' && (
          <InspectorTaskingModule
            missions={missions}
            auditLogs={auditLogs}
            reports={reports}
            currentRole={currentRole}
            onResolveReport={handleResolveReport}
          />
        )}

        {/* Tab 5: AI Anomaly Radar & Shortage Predictor */}
        {activeTab === 'ai-analytics' && (
          <AiAnalyticsModule
            anomalies={anomalies}
            commodities={commodities}
          />
        )}

        {/* Tab 6: Architecture Deliverables, PostGIS DDLs, Docker & Flutter */}
        {activeTab === 'architecture-docs' && (
          <ArchitectureDeliverablesView />
        )}
      </main>

      {/* Footer Sovereign Credits */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 font-bold">منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية</span>
            <span>•</span>
            <span>مشروع سيادي رقمي للشفافية ومكافحة المضاربة غير المشروعة</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>PostGIS 3.4 Spatial Engine</span>
            <span>•</span>
            <span>Redis 7 Cache</span>
            <span>•</span>
            <span>Node.js / Express</span>
            <span>•</span>
            <span>Flutter Client Ready</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        commodities={commodities}
        initialCommodity={selectedCommodityForReport}
        onSubmitReport={handleCreateReport}
      />

      <PassportDetailModal
        shipment={selectedShipmentForModal}
        onClose={() => setSelectedShipmentForModal(null)}
        onVerifyShipment={handleVerifyShipment}
      />
    </div>
  );
}
