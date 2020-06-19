import React, {Component} from 'react';

import Typography from '@material-ui/core/Typography';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid'

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import { Scatter } from 'react-chartjs-2';

import './App.css';
import deaths from './deaths.json'

const recent_week = 23;

class App extends Component{
  constructor(){
    super();
    this.state = {
      jurisdiction: 'United States',
      hideRecentWeeks: 4,
      method: 'Mean',
    }
  }

  render(){
    var jurisdictions = Object.keys(deaths).sort();
    jurisdictions.splice(jurisdictions.indexOf('United States'), 1);
    jurisdictions.unshift('United States');

    var dataspecs = [
      {
        year: 2015,
        color: '#fabed4',
        lineWidth: 1,
      },
      {
        year: 2016,
        color: '#ffd8b1',
        lineWidth: 1,
      },
      {
        year: 2017,
        color: '#fffac8',
        lineWidth: 1,
      },
      {
        year: 2018,
        color: '#aaffc3',
        lineWidth: 1,
      },
      {
        year: 2019,
        color: '#dcbeff',
        lineWidth: 1,
      },
      {
        year: 2020,
        color: '#e6194B',
        lineWidth: 3,
        recentHideApplies: true,
        fill: '-1',
      },
      {
        year: '2015-2019 ' + this.state.method,
        color: '#f58231',
        lineWidth: 3,
        recentHideApplies: true,
      },
      {
        year: '2015-2019 ' + this.state.method + ' + COVID-19 Reported',
        color: '#f58231',
        lineWidth: 3,
        dash: [5, 5],
        recentHideApplies: true,
      },
    ];
    var datasets = [];
    var totals = {};
    for(var dataspec of dataspecs){
      var reshape_data = [];
      totals[dataspec.year] = 0
      for(var week in deaths[this.state.jurisdiction][dataspec.year]['All Deaths']){
        if(dataspec.recentHideApplies && week > recent_week - this.state.hideRecentWeeks){
          continue;
        }

        var count = deaths[this.state.jurisdiction][dataspec.year]['All Deaths'][week];
        totals[dataspec.year] += count;

        reshape_data.push({
          x: week,
          y: count,
        });
      }

      datasets.push({
        label: dataspec.year,
        fill: false,
        showLine: true,

        pointRadius: 0,
        tension: 0,

        borderColor: dataspec.color,
        borderWidth: dataspec.lineWidth,
        borderDash: dataspec.dash,

        hidden: dataspec.hidden,

        //fill: dataspec.fill || false,

        data: reshape_data,
      });

      totals[dataspec.year] = Math.round(totals[dataspec.year]);
    }

    var data = {
      labels: ['Scatter Data'],
      datasets: datasets,
    }

    var options = {
        maintainAspectRatio: false,
        scales:{
            yAxes:[        
                {
                    display: true,
                    position: 'left',
                    id: 'y-axis-0',
                    scaleLabel:{
                        display: true,
                        labelString: 'Deaths',
                    },
                },
            ],
            xAxes: [{
              type: 'linear',
              position: 'bottom',
              scaleLabel:{
                  display: true,
                  labelString: 'Week of Year',
              },
              ticks: {
                min: 1,
                max: 52,
                stepSize: 4,
              },
            }],
        },
        plugins: {
          filler: {
              propagate: false,
          },
        },
    }

    return (
      <Container style={{height: '100vh'}}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h4" component="h1">
              Week-of-year Death Count, Reported Total and COVID-19 Estimated Total
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl style={{minWidth: 160}}>
              <InputLabel>Jurisdiction</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={this.state.jurisdiction}
                onChange={(event) => {this.setState({jurisdiction: event.target.value})}}
              >
                {jurisdictions.map(jurisdiction =>{
                    return (<MenuItem value={jurisdiction}>{jurisdiction}</MenuItem>);
                })}
              </Select>
            </FormControl>
            &nbsp;
            <FormControl style={{minWidth: 160}}>
              <InputLabel>Estimation Method</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={this.state.method}
                minWidth={120}
                onChange={(event) => {this.setState({method: event.target.value})}}
              >
                {['Mean','Max'].map(method =>{
                    return (<MenuItem value={method}>{method}</MenuItem>);
                })}
              </Select>
            </FormControl>
            &nbsp;
            <FormControl style={{minWidth: 160}}>
              <InputLabel>Ignore Recent Weeks</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={this.state.hideRecentWeeks}
                minWidth={120}
                onChange={(event) => {this.setState({hideRecentWeeks: event.target.value})}}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(weeks =>{
                    return (<MenuItem value={weeks}>{weeks}</MenuItem>);
                })}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={2} align='center' style={{height: '60%'}}>
          <Grid item xs={12} style={{height:'100%'}}>
            <Scatter data={data} options={options} ref={this.refName}/>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Dotted line shows the resulting weekly deaths if reported COVID-19 death counts per week are added to the historical {this.state.method.toLowerCase()} weekly
            death rate from 2015-2019.
          </Typography>
          <br/>
          <Typography variant="h6" component="h6">
            YTD Total Deaths, {this.state.jurisdiction}:
          </Typography>
          <Typography variant="body1">
            &nbsp;&nbsp;2020 Reported: {totals[2020].toLocaleString()}<br/>
            &nbsp;&nbsp;{'2015-2019 ' + this.state.method + ' + COVID-19 Reported'}: {totals['2015-2019 ' + this.state.method + ' + COVID-19 Reported'].toLocaleString()}<br/>
            &nbsp;&nbsp;{'2015-2019 ' + this.state.method}: {totals['2015-2019 ' + this.state.method].toLocaleString()}<br/>
          </Typography>
          <Typography variant="h6" component="h6">
            Discrepancy:
          </Typography>
          <Typography variant="body1">
            &nbsp;&nbsp;COVID-19 Reported Deaths: {(totals['2015-2019 ' + this.state.method + ' + COVID-19 Reported'] - totals['2015-2019 ' + this.state.method]).toLocaleString()}<br/>
            &nbsp;&nbsp;Total 2020 Deaths - Historical {this.state.method}: {(totals[2020] - totals['2015-2019 ' + this.state.method]).toLocaleString()}<br/>
          </Typography>
          <br/>
          <Typography variant="body1">
            Death rates are likely incomplete for recent weeks, per CDC: "Currently, 63% of all U.S. deaths are reported within 10 days of the date of death, but there is significant variation between states."
          </Typography>
          <Typography variant="caption">
            Data sources: <a href="https://data.cdc.gov/NCHS/Weekly-counts-of-deaths-by-jurisdiction-and-age-gr/y5bj-9g5w/">CDC/NCHS 1</a> and <a href="https://data.cdc.gov/NCHS/Provisional-COVID-19-Death-Counts-by-Week-Ending-D/r8kw-7aab">CDC/NCHS 2</a>
          </Typography>
        </Grid>
      </Container>
    );
  }
}

export default App;
