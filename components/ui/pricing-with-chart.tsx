'use client';

import { Button } from '@/components/ui/button';
import { CheckCircleIcon } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';

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
					Simple Plans for Every Job Seeker
				</h1>
				<p className={`mt-4 text-sm md:text-base ${
					isDark ? 'text-white/70' : 'text-gray-600'
				}`}>
					Start free, then upgrade when you need higher limits and advanced AI tools.
				</p>
			</div>

			{/* Pricing Grid */}
			<div className={`grid rounded-xl border md:grid-cols-6 ${
				isDark 
					? 'bg-white/5 border-white/20 backdrop-blur-md' 
					: 'bg-white border-gray-200 shadow-xl'
			}`}>
				{/* Free Plan */}
				<div className={`flex flex-col justify-between border-b p-6 md:col-span-2 md:border-r md:border-b-0 ${
					isDark ? 'border-white/20' : 'border-gray-200'
				}`}>
					<div className="space-y-4">
						<div>
							<h2 className={`inline rounded-[2px] p-1 text-xl font-semibold ${
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
								Great for trying CSpark
							</p>
						</div>

						<Button asChild variant="outline" className={`w-full ${
							isDark 
								? 'border-white/20 bg-white/10 text-white hover:bg-white/20' 
								: 'border-gray-300 hover:bg-gray-50'
						}`}>
							<a href="/register">Get Started</a>
						</Button>

						<div className={`my-6 h-px w-full ${
							isDark ? 'bg-white/20' : 'bg-gray-200'
						}`} />

						<ul className={`space-y-3 text-sm ${
							isDark ? 'text-white/70' : 'text-gray-600'
						}`}>
							{[
								'1 CV creation',
								'1 job search (up to 25 results)',
								'Manual CV editing',
								'Download as PDF',
								'Basic support',
							].map((item, index) => (
								<li key={index} className="flex items-center gap-2">
									<CheckCircleIcon className="h-4 w-4 text-blue-500" />
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Pro Plan */}
				<div className="z-10 grid gap-8 overflow-hidden p-6 md:col-span-4 lg:grid-cols-2">
					{/* Pricing + Chart */}
					<div className="flex flex-col justify-between space-y-6">
						<div>
							<h2 className={`text-xl font-semibold ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}>
								Pro
							</h2>
							<span className="my-3 block text-3xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
								$9.99<span className={`text-base ml-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>/month</span>
							</span>
							<p className={`text-sm ${
								isDark ? 'text-white/60' : 'text-gray-600'
							}`}>
								or $79.99/year (best value)
							</p>
							<p className={`text-sm ${
								isDark ? 'text-white/60' : 'text-gray-600'
							}`}>
								For serious job seekers
							</p>
						</div>
						<div className={`h-fit w-full rounded-lg border p-2 ${
							isDark 
								? 'bg-white/5 border-white/20' 
								: 'bg-gray-50 border-gray-200'
						}`}>
							<InterestChart isDark={isDark} />
						</div>
					</div>
					{/* Features */}
					<div className="relative w-full">
						<div className={`text-sm font-medium ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}>
							Everything in Free plus:
						</div>
						<ul className={`mt-4 space-y-3 text-sm ${
							isDark ? 'text-white/70' : 'text-gray-600'
						}`}>
							{[
								'Unlimited CV creation',
								'10 job searches per cycle',
								'Result limits: 25, 50, or all',
								'AI-powered CV optimization',
								'Job posting-specific tailoring',
								'Automatic cover letter generation',
								'LinkedIn job search integration',
								'QR code CV sharing',
								'Multiple CV version management',
								'Priority support',
							].map((item, index) => (
								<li key={index} className="flex items-center gap-2">
									<CheckCircleIcon className="h-4 w-4 text-violet-500" />
									{item}
								</li>
							))}
						</ul>

						{/* Call to Action */}
						<div className="mt-10 grid w-full grid-cols-2 gap-2.5">
							<Button
								asChild
								className="bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
							>
									<a href="/register">Upgrade to Pro</a>
								</Button>
								<Button asChild variant="outline" className={
									isDark 
										? 'border-white/20 bg-white/10 text-white hover:bg-white/20' 
										: 'border-gray-300 hover:bg-gray-50'
								}>
									<a href="/register">View Plans</a>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function InterestChart({ isDark = true }: { isDark?: boolean }) {
	const chartData = [
		{ month: 'January', interest: 120 },
		{ month: 'February', interest: 180 },
		{ month: 'March', interest: 150 },
		{ month: 'April', interest: 210 },
		{ month: 'May', interest: 250 },
		{ month: 'June', interest: 300 },
		{ month: 'July', interest: 280 },
		{ month: 'August', interest: 320 },
		{ month: 'September', interest: 340 },
		{ month: 'October', interest: 390 },
		{ month: 'November', interest: 420 },
		{ month: 'December', interest: 500 },
	];

	const chartConfig = {
		interest: {
			label: 'Users',
			color: isDark ? 'hsl(250, 70%, 60%)' : 'hsl(250, 70%, 50%)',
		},
	} satisfies ChartConfig;

	return (
		<Card className={
			isDark 
				? 'bg-white/5 border-white/10' 
				: 'bg-white border-gray-200'
		}>
			<CardHeader className={`space-y-0 border-b p-3 ${
				isDark ? 'border-white/10' : 'border-gray-200'
			}`}>
				<CardTitle className={`text-lg ${
					isDark ? 'text-white' : 'text-gray-900'
				}`}>
					User Interest
				</CardTitle>
				<CardDescription className={`text-xs ${
					isDark ? 'text-white/60' : 'text-gray-600'
				}`}>
					Number of users subscribed to Pro plan in the last 12 months.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-3">
				<ChartContainer config={chartConfig} className="h-[200px] w-full">
					<LineChart data={chartData} margin={{ left: 12, right: 12 }}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<Line
							dataKey="interest"
							type="monotone"
							stroke="var(--color-interest)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
