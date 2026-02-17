'use client';

import { Button } from '@/components/ui/button';
import { CheckCircleIcon } from 'lucide-react';

interface PricingWithChartProps {
	isDark?: boolean;
}

export function PricingWithChart({ isDark = true }: PricingWithChartProps) {
	return (
		<div className="mx-auto max-w-6xl">
			{/* Heading */}
			<div className="mx-auto mb-10 max-w-2xl text-center">
				<h1 className={`text-4xl font-extrabold tracking-tight lg:text-5xl ${
					isDark ? 'text-white' : 'text-gray-900'
				}`}>
					Simple Plans for Focused Job Search
				</h1>
				<p className={`mt-4 text-sm md:text-base ${
					isDark ? 'text-white/70' : 'text-gray-600'
				}`}>
					Start free, then upgrade when you need more searches, optimizations, and tracking.
				</p>
			</div>

			{/* Pricing Grid */}
			<div className={`grid gap-6 rounded-xl border p-6 lg:grid-cols-3 ${
				isDark
					? 'bg-white/5 border-white/20 backdrop-blur-md'
					: 'bg-white border-gray-200 shadow-xl'
			}`}>
				{/* Free Plan */}
				<div className={`rounded-xl border p-6 ${
					isDark ? 'border-white/20 bg-white/5' : 'border-gray-200 bg-white'
				}`}>
					<div className="space-y-4">
						<div>
							<h2 className={`text-xl font-semibold ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}>
								Free
							</h2>
							<span className="my-3 block text-3xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
								$0
							</span>
							<p className={`text-sm ${
								isDark ? 'text-white/60' : 'text-gray-600'
							}`}>
								Try CSpark and build your first job-tailored CV.
							</p>
						</div>
						<Button asChild variant="outline" className={`w-full ${
							isDark
								? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
								: 'border-gray-300 hover:bg-gray-50'
						}`}>
							<a href="/register">Start Free</a>
						</Button>
						<ul className={`mt-6 space-y-3 text-sm ${
							isDark ? 'text-white/70' : 'text-gray-600'
						}`}>
							{[
								{ text: '1 LinkedIn job search', bold: true },
								{ text: '1 CV creation', bold: true },
								{ text: '1 CV optimization', bold: true },
								{ text: 'ATS-friendly templates', bold: false },
								{ text: 'Shareable CV link + QR', bold: false },
							].map((item, index) => (
								<li key={index} className={`flex items-center gap-2 ${
									item.bold ? 'font-semibold' : ''
								}`}>
									<CheckCircleIcon className="h-4 w-4 text-blue-500" />
									{item.text}
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Pro Plan */}
				<div className={`rounded-xl border p-6 ${
					isDark ? 'border-violet-400/40 bg-white/5' : 'border-violet-200 bg-white'
				}`}>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className={`text-xl font-semibold ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}>
								Pro
							</h2>
							<span className={`text-xs font-semibold px-2 py-1 rounded-full ${
								isDark ? 'bg-violet-500/20 text-violet-200' : 'bg-violet-100 text-violet-700'
							}`}>
								Most Popular
							</span>
						</div>
						<span className="my-3 block text-3xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
							$19.99<span className={`text-base ml-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>/month</span>
						</span>
						<p className={`text-sm ${
							isDark ? 'text-white/70' : 'text-gray-600'
						}`}>
							$79.99/year ($6.66/mo). Save 60% annually.
						</p>
						<Button asChild className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700">
							<a href="/register">Unlock Pro</a>
						</Button>
						<div className={`rounded-lg border p-4 ${
							isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
						}`}>
							<div className={`text-sm font-semibold ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}>
								Pro Unlocks
							</div>
							<ul className={`mt-3 space-y-2 text-sm ${
								isDark ? 'text-white/70' : 'text-gray-600'
							}`}>
								{[
									'Unlimited CV creation and optimization',
									'10 LinkedIn job searches per cycle',
									'Job-specific CV versions and history',
									'Application tracker + interview notes',
									'Advanced templates and sharing controls',
								].map((item, index) => (
									<li key={index} className="flex items-center gap-2">
										<CheckCircleIcon className="h-4 w-4 text-violet-500" />
										{item}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				{/* Comparison */}
				<div className={`rounded-xl border p-6 ${
					isDark ? 'border-white/20 bg-white/5' : 'border-gray-200 bg-white'
				}`}>
					<div className={`text-sm font-semibold ${
						isDark ? 'text-white' : 'text-gray-900'
					}`}>
						Free vs Pro
					</div>
					<div className={`mt-4 grid gap-3 text-sm ${
						isDark ? 'text-white/70' : 'text-gray-600'
					}`}>
						{[
							{ label: 'LinkedIn job searches', free: '1', pro: '10 / cycle' },
							{ label: 'CV creations', free: '1', pro: 'Unlimited' },
							{ label: 'CV optimizations', free: '1', pro: 'Unlimited' },
							{ label: 'Templates', free: 'Basic', pro: 'All' },
							{ label: 'Shareable links + QR', free: 'Yes', pro: 'Yes + privacy controls' },
							{ label: 'Version history', free: 'No', pro: 'Yes' },
							{ label: 'Application tracker', free: 'No', pro: 'Yes' },
						].map((row, index) => (
							<div key={index} className={`grid grid-cols-[1.4fr_0.8fr_0.9fr] gap-2 rounded-lg p-2 ${
								isDark ? 'bg-white/5' : 'bg-gray-50'
							}`}>
								<span className={isDark ? 'text-white/90' : 'text-gray-900'}>{row.label}</span>
								<span className="text-center">{row.free}</span>
								<span className="text-center font-semibold text-blue-500">{row.pro}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
