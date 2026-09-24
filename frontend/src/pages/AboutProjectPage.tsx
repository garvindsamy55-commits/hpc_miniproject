import React, { useState } from 'react';
import { HelpCircle, BookOpen, ChevronDown, ChevronUp, Award, Cloud, Cpu, ShieldCheck, Zap, Layers } from 'lucide-react';

export const AboutProjectPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: '1. What is Cloud Computing and what core model does CloudBurst implement?',
      a: 'Cloud Computing is the on-demand delivery of compute power, database storage, applications, and other IT resources via the internet with pay-as-you-go pricing. CloudBurst implements the Infrastructure as a Service (IaaS) and Serverless Function as a Service (FaaS) paradigm by utilizing Microsoft Azure Blob Storage for cloud object storage and Azure Functions for event-driven file compute.'
    },
    {
      q: '2. What is Azure Blob Storage and what role does it play in CloudBurst?',
      a: 'Azure Blob Storage is Microsoft\'s massively scalable object storage service offering up to 99.99999999999999% (16 9s) of data durability with geo-redundancy. In CloudBurst, Blob Storage acts as the decoupled cloud storage tier: raw files are uploaded to an Input Container, which triggers event-driven processing, and analyzed result JSON metadata is written to an Output Container.'
    },
    {
      q: '3. Does Azure Blob Storage perform file computation itself?',
      a: 'No! Azure Blob Storage is strictly a cloud object storage system; it does not contain a CPU/compute engine to execute application code. In CloudBurst, compute is performed either by our FastAPI Multiprocessing Worker Pool or by serverless Azure Functions triggered by Blob creation events.'
    },
    {
      q: '4. What is Azure Functions and how does serverless computing work?',
      a: 'Azure Functions is a serverless compute service that runs event-triggered code without explicitly provisioning or managing infrastructure. When a file is uploaded to the Input Blob Container, a Blob Trigger invokes azure_function.py, which downloads or streams the blob, computes SHA-256 and metadata, and writes the output to the Output Blob Container.'
    },
    {
      q: '5. What is the difference between Sequential and Parallel File Processing?',
      a: 'In Sequential Processing, files are executed one after another (T_total = T1 + T2 + ... + Tn). If one file is slow, all subsequent files wait. In Parallel Processing (CloudBurst), multiple worker threads execute independent file jobs concurrently across multiple CPU cores, dramatically reducing total completion time.'
    },
    {
      q: '6. What is Speedup and what is its mathematical formula?',
      a: 'Speedup (S) measures the performance multiplier gained by parallel execution compared to sequential execution:\n\nS = T_sequential / T_parallel\n\nFor example, if 8 files take 1000ms sequentially (1 worker) and 280ms with 4 parallel workers, Speedup S = 1000 / 280 = 3.57x.'
    },
    {
      q: '7. What is Parallel Efficiency and why does it decrease with many workers?',
      a: 'Parallel Efficiency (E) measures how effectively additional workers are utilized:\n\nE = Speedup / Number_of_Workers (or E = T1 / (p * Tp))\n\nIdeal linear speedup yields E = 1.0 (100%). In practice, overhead from thread scheduling, lock synchronization, and disk I/O causes efficiency to decrease as worker count increases.'
    },
    {
      q: '8. What is Amdahl\'s Law and how does it apply to CloudBurst?',
      a: 'Amdahl\'s Law states that the maximum speedup of a parallel system is strictly constrained by the serial (non-parallelizable) fraction (1 - P) of the workload:\n\nS_max = 1 / ((1 - P) + (P / N))\n\nIn CloudBurst, tasks like disk I/O, database commits, and queue dispatching represent serial overhead (1 - P), ensuring that even with infinite workers, speedup is mathematically bounded.'
    },
    {
      q: '9. What is System Throughput in CloudBurst?',
      a: 'Throughput is the number of file processing tasks successfully completed per unit of time:\n\nThroughput = Number of Files / Execution Time (seconds)\n\nCloudBurst measures throughput dynamically in both files/second and megabytes/second.'
    },
    {
      q: '10. Why must the browser NEVER communicate directly with Azure in CloudBurst?',
      a: 'Direct browser-to-Azure communication would require exposing Azure client secrets, storage access keys, or granting permissive public container permissions, violating cloud security best practices. CloudBurst enforces an enterprise architecture: React Frontend -> FastAPI Backend API Gateway -> Azure SDK -> Azure Cloud Services.'
    },
    {
      q: '11. How does Local Demo Mode work without Azure credentials?',
      a: 'Local Demo Mode runs a real Python multiprocessing ThreadPoolExecutor pool, manages an SQLite task queue, computes genuine SHA-256 hashes and linguistic/tabular/image metadata, and saves JSON artifacts to the local storage/ directory without requiring any Azure subscription or connection string.'
    },
    {
      q: '12. What file types and computation algorithms does CloudBurst support?',
      a: 'CloudBurst supports TXT, LOG, CSV, JSON, PNG, JPG, and PDF. It performs real computations: SHA-256 cryptographic digests, word/line/character counts, token frequency analysis, CSV column statistics (min, max, mean), JSON AST structure parsing, and image dimension/color analysis.'
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      {/* Project Overview Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">
              CloudBurst: Parallel File Processing System using Azure
            </h2>
            <p className="text-xs text-slate-400">
              High Performance and Cloud Computing (HPCC) Mini-Project 2026
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          CloudBurst is an engineering mini-project that bridges High Performance Computing (HPC) parallel worker algorithms with modern Cloud Computing infrastructure (Microsoft Azure Blob Storage and Azure Functions). It offers dual operating modes: zero-config <strong>Local Demo Mode</strong> using genuine multiprocessing threads, and production <strong>Azure Cloud Mode</strong> using the Azure SDK and serverless Blob triggers.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Frontend</span>
            <strong className="text-cyan-300 font-mono">React 18 + TS + Tailwind</strong>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Backend</span>
            <strong className="text-indigo-300 font-mono">FastAPI + Uvicorn</strong>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Cloud Services</span>
            <strong className="text-sky-300 font-mono">Azure Blob + Functions</strong>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">HPC Engine</span>
            <strong className="text-emerald-300 font-mono">Parallel Worker Pool</strong>
          </div>
        </div>
      </div>

      {/* College Viva Questions & Answers Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            College Viva Preparation &amp; Technical Q&amp;A
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Frequently asked conceptual questions covering Cloud Computing, Microsoft Azure Architecture, and High Performance Parallel Processing.
        </p>

        <div className="space-y-2.5">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-cyan-400">{item.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line bg-slate-950/30">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
