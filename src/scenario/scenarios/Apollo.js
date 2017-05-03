
import Labels from 'graphics2d/Labels';
import { getUniverse } from 'JSOrrery';
import { getMissionFromName } from './NasaNumbers';
import { earth } from './bodies/earth';
import { moon } from './bodies/moon';


const g = window.location.search.match(/apollo=([0-9]+)/);
const apolloNumber = (g && g[1]) || '11';
// const apolloEarthOrbit = getMissionFromName(`Apollo${apolloNumber}`).getNumbers('earth');
const apolloTLIOrbit = getMissionFromName(`Apollo${apolloNumber}`).getNumbers('TLI');
const epoch = apolloTLIOrbit.epoch;

//apollo 8, 10, 12, 15, 16 work better with moon position calculated from physics
//apollo 11, 14 work better with moon position always calculated from elements
//apollo 13, 17 don't work at all
//I chose to use the way it works better for each mission. Even if it seems like cheating, the goal of the simulation is to show an approximation of the free return trajectory, and it does not pretend to be as accurate as Nasa could get it. All the numbers involved come from different sources, and I don't know how accurate they are anyway, so better show something plausible instead of seeking perfect accuracy. 
const osculatingOrbit = [8, 11, 14].indexOf(Number(apolloNumber)) > -1;

const apolloBase = {
	title: `Apollo ${apolloNumber}`,
	relativeTo: 'earth',
	mass: 1,
	radius: 2,
	color: '#00ffff',
	traceColor: '#ffffff',
	vertexDist: 100000,
	forceTrace: true,
	showSolidOrbit: true,
	data: {
	},
	logForces: true,
};

const apolloTLI = Object.assign(
	{},
	apolloBase,
	{
		customInitialize() {
			this.data = {};
		},
		customAfterTick(elapsedTime, absoluteDate, deltaT) {
			let dist;

			if (!this.data.isOnReturnTrip) {
				if (!this.data.hasTLILabel && this.relativePosition.x !== 0) {
					Labels.addEventLabel('Trans Lunar Injection', this.relativePosition.clone(), getUniverse().getBody(this.relativeTo));
					this.data.hasTLILabel = true;
				}


				dist = (Math.abs(this.position.clone().sub(getUniverse().getBody('moon').position).length()) / 1000) - getUniverse().getBody('moon').radius;
				let moonSpeed = 0;
				if (this.data.lastMoonDist) {
					moonSpeed = ((this.data.lastMoonDist - dist) / deltaT) * 1000;
				}

				if (!this.data.minMoonDist || dist < this.data.minMoonDist) {
					this.data.minMoonDist = dist;
				} else if (this.data.lastMoonDist === this.data.minMoonDist) {
					Labels.addEventLabel('Closest distance to<br>the Moon: ' + Math.round(this.data.minMoonDist) + ' km', this.previousRelativePosition.clone(), getUniverse().getBody(this.relativeTo));
					this.data.isOnReturnTrip = true;
					//Universe.stop();
				}

				this.data.lastMoonDist = dist;
				this.data.minMoonSpeed = !this.data.minMoonSpeed || (this.data.minMoonSpeed > moonSpeed) ? moonSpeed : this.data.minMoonSpeed;
				this.data.minSpeed = !this.data.minSpeed || (this.data.minSpeed > this.speed) ? this.speed : this.data.minSpeed;

			} else {
				dist = (Math.abs(this.position.clone().sub(getUniverse().getBody('earth').position).length()) / 1000) - getUniverse().getBody('earth').radius;
				if (!this.data.minEarthDist || dist < this.data.minEarthDist) {
					this.data.minEarthDist = dist;
				} else if (this.data.lastEarthDist === this.data.minEarthDist && dist < (Math.abs(this.position.clone().sub(getUniverse().getBody('moon').position).length()) / 1000)) {
					Labels.addEventLabel('Closest distance to<br>the Earth: ' + Math.round(this.data.minEarthDist) + ' km<br>Simulation stopped', this.previousRelativePosition.clone(), getUniverse().getBody(this.relativeTo));
					getUniverse().stop();
				}

				this.data.lastEarthDist = dist;
				
			}
		},
	}
);

export default {
	usePhysics: true,
	name: 'Apollo',
	title: `Apollo ${apolloNumber} free return trajectory`,
	commonBodies: [earth, moon],
	secondsPerTick: { min: 100, max: 500, initial: 200 },
	calculationsPerTick: 200,
	calculateAll: true,
	// useBarycenter: false,
	forcedGuiSettings: {
		date: epoch,
		scale: 1,
	},
	bodies: {
		earth: {
		
		},
		moon: {
			osculatingOrbit,
			showSolidOrbit: true,
		},
		apolloTLI: Object.assign({},
			apolloTLI,
			apolloTLIOrbit,
			{
				title: `Apollo ${apolloNumber}`,
			}
		),
		/*,
		apolloEO: _.extend({},
			apolloNumber === '8' ? apollo8: apolloBase,
			apolloEarthOrbit,
			{
				title: 'Apollo '+apolloNumber+' EO',
			}
		)/**/
	},
	help: "Paths of Apollo <a href=\"http://en.wikipedia.org/wiki/Free_return_trajectory\" target=\"_blank\">free return trajectories</a> are calculated from data available on Nasa's website. Data for every Moon mission is available, but all don't work perfectly in the simulation. I chose to display Apollo 8, because it was the first mission to get to the moon. The return path doesn't get exactly to Earth's atmosphere, but keep in mind that the simulated trajectory that you see here does not depend solely on Apollo's numbers, but also on the Moon's and the Earth's calculated positions, velocities and masses. Furthermore, I can't pretend that the algorithm I programmed to calculate the forces resulting from gravity is on par with what Nasa scientists can do. Still, the simulation is precise enough to get a very good idea of the shape of the free return trajectory and the genius behind it.",
};