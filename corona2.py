import pandas as pd
import datetime
import json

def date_to_week(d):
    split_date = d.split('/')
    return int(datetime.date(int(split_date[2]), int(split_date[0]), int(split_date[1])).strftime('%U'))

# Historical deaths data (and 2020, which will be overwritten where possible)
deaths = pd.read_csv('deaths.csv')
deaths = deaths.drop(columns=['Type', 'Week Ending Date', 'Time Period', 'Suppress','Note','State Abbreviation'])

deaths = deaths.rename(columns={'Age Group': 'Slice'})
deaths = deaths.rename(columns={'Number of Deaths': 'Deaths'})

#deaths = deaths.set_index(['Jurisdiction', 'Year', 'Slice', 'Week'])

all_deaths = deaths.set_index(['Jurisdiction', 'Year', 'Slice', 'Week']).sum(level=[0, 1, 3]).reset_index()
all_deaths['Slice'] = 'All Deaths'

mean_deaths = all_deaths[all_deaths['Year'] != 2020].set_index(['Jurisdiction', 'Year', 'Slice', 'Week']).mean(level=[0, 2, 3]).reset_index()
mean_deaths['Year'] = '2015-2019 Mean'

max_deaths = all_deaths[all_deaths['Year'] != 2020].set_index(['Jurisdiction', 'Year', 'Slice', 'Week']).max(level=[0, 2, 3]).reset_index()
max_deaths['Year'] = '2015-2019 Max'

# 2020 total deaths, and COVID deaths (filtering out other "select deaths numbers")
covid_deaths = pd.read_csv('covid19_deaths_2020-06-19.csv')
covid_deaths = covid_deaths.drop(columns=['Influenza Deaths', 'Pneumonia and COVID-19 Deaths', 'Pneumonia Deaths'])
covid_deaths = covid_deaths.drop(columns=['Percent of Expected Deaths', 'Data as of', 'Start week', 'Group'])
covid_deaths = covid_deaths.drop(columns=['Pneumonia, Influenza, or COVID-19 Deaths', 'Indicator', 'Footnote'])

covid_deaths = covid_deaths.rename(columns={'State': 'Jurisdiction'})
covid_deaths = covid_deaths.rename(columns={'End Week': 'Week'})
covid_deaths = covid_deaths.rename(columns={'Total Deaths': 'All Deaths'})

covid_deaths['Week'] = covid_deaths['Week'].map(date_to_week)
covid_deaths['Year'] = 2020

covid_deaths = covid_deaths.melt(var_name='Slice', value_vars=['COVID-19 Deaths', 'All Deaths'], value_name='Deaths', id_vars=['Jurisdiction', 'Year', 'Week'])
#covid_deaths = covid_deaths.set_index(['Jurisdiction', 'Year', 'Slice', 'Week'])

covid_mean_implied = pd.concat([covid_deaths[covid_deaths['Slice'] == 'COVID-19 Deaths'], mean_deaths])\
    .set_index(['Jurisdiction', 'Year', 'Slice', 'Week']).sum(level=[0, 3]).reset_index()
covid_mean_implied['Year'] = '2015-2019 Mean + COVID-19 Reported'
covid_mean_implied['Slice'] = 'All Deaths'

covid_max_implied = pd.concat([covid_deaths[covid_deaths['Slice'] == 'COVID-19 Deaths'], max_deaths])\
    .set_index(['Jurisdiction', 'Year', 'Slice', 'Week']).sum(level=[0, 3]).reset_index()
covid_max_implied['Year'] = '2015-2019 Max + COVID-19 Reported'
covid_max_implied['Slice'] = 'All Deaths'

deaths_all = pd.concat([deaths, all_deaths, mean_deaths, max_deaths, covid_mean_implied, covid_max_implied, covid_deaths])
deaths_all = deaths_all.drop_duplicates(subset=['Jurisdiction', 'Year', 'Slice', 'Week'], keep='last') # Take more recent covid deaths total data over older historical dataset (which includes some 2020)
#deaths_all = deaths_all.set_index(['Jurisdiction', 'Year', 'Slice', 'Week'])

deaths_all = deaths_all.pivot_table(index='Week', columns=['Jurisdiction', 'Year', 'Slice'], values='Deaths')



# Cannot find a good pandas way to do this
deaths_dict = {}
for index in deaths_all:
    # deaths_dict[index] = deaths_all[index]
    traverse = deaths_dict
    for i in range(len(index) - 1):
        if index[i] not in traverse:
            traverse[index[i]] = {}

        traverse = traverse[index[i]]

    traverse[index[-1]] = deaths_all[index].dropna().to_dict()

    #print(deaths)

with open('src/deaths.json', 'w') as fp:
    json.dump(deaths_dict, fp, allow_nan=False)
