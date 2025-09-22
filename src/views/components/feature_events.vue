<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';

const route = useRoute();
const router = useRouter();

// Featured conference data - multiple conferences
const featuredConferences = reactive([
  {
    id: 1,
    logo: 'https://icml.cc/static/core/img/ICML-logo.png',
    conferenceName: 'ICML 2025',
    conferenceFullName: 'International Conference on Machine Learning',
    conferenceDate: 'July 21-27, 2025',
    location: {
      city: 'Vienna',
      country: 'Austria', 
      venue: 'Austria Center Vienna'
    },
    websites: {
      official: 'https://icml.cc',
      committee: 'https://icml.cc/Conferences/2025/Organizers',
      registration: 'https://icml.cc/Conferences/2025/Registration'
    },
    category: 'Machine Learning',
    submissionDeadline: 'February 1, 2025',
    notificationDate: 'April 25, 2025',
    description: 'The premier global event for machine learning research, bringing together researchers and practitioners from around the world.',
    topics: ['Deep Learning', 'Reinforcement Learning', 'Computer Vision', 'Natural Language Processing', 'Optimization'],
    tier: 'Tier 1',
    acceptanceRate: '22%',
    expectedAttendees: '4,500+'
  },
  {
    id: 2,
    logo: 'https://iclr.cc/static/core/img/ICLR-logo.svg',
    conferenceName: 'ICLR 2025',
    conferenceFullName: 'International Conference on Learning Representations',
    conferenceDate: 'May 7-11, 2025',
    location: {
      city: 'Singapore',
      country: 'Singapore',
      venue: 'Singapore EXPO'
    },
    websites: {
      official: 'https://iclr.cc',
      committee: 'https://iclr.cc/Conferences/2025/Organizers',
      registration: 'https://iclr.cc/Conferences/2025/Registration'
    },
    category: 'Deep Learning',
    submissionDeadline: 'October 1, 2024',
    notificationDate: 'January 15, 2025',
    description: 'A top-tier venue for research on learning representations, with a focus on deep learning and representation learning.',
    topics: ['Representation Learning', 'Deep Learning Theory', 'Generative Models', 'Transfer Learning'],
    tier: 'Tier 1',
    acceptanceRate: '19%',
    expectedAttendees: '3,200+'
  },
  {
    id: 3,
    logo: 'https://aaai.org/wp-content/uploads/2020/09/AAAI-Logo.jpg',
    conferenceName: 'AAAI 2025',
    conferenceFullName: 'AAAI Conference on Artificial Intelligence',
    conferenceDate: 'February 25 - March 4, 2025',
    location: {
      city: 'Philadelphia',
      country: 'USA',
      venue: 'Pennsylvania Convention Center'
    },
    websites: {
      official: 'https://aaai.org',
      committee: 'https://aaai.org/Conferences/AAAI-25/organizers',
      registration: 'https://aaai.org/Conferences/AAAI-25/registration'
    },
    category: 'Artificial Intelligence',
    submissionDeadline: 'August 15, 2024',
    notificationDate: 'November 9, 2024',
    description: 'The premier conference in artificial intelligence, covering all aspects of AI research and applications.',
    topics: ['AI Theory', 'Machine Learning', 'Knowledge Representation', 'Robotics', 'Natural Language Processing'],
    tier: 'Tier 1',
    acceptanceRate: '20%',
    expectedAttendees: '5,000+'
  }
]);

// Current selected conference
const selectedConference = ref(featuredConferences[0]);

// Conference statistics
const conferenceStats = computed(() => ({
  totalConferences: featuredConferences.length,
  categories: [...new Set(featuredConferences.map(c => c.category))],
  avgAcceptanceRate: Math.round(
    featuredConferences.reduce((sum, c) => sum + parseInt(c.acceptanceRate), 0) / featuredConferences.length
  )
}));

function selectConference(conference: any) {
  selectedConference.value = conference;
}

function registerInterest(conferenceId: number) {
  ElMessage.success('Interest registered! You will receive updates about this conference.');
}

// Get tier color
function getTierColor(tier: string) {
  switch (tier) {
    case 'Tier 1': return '#d97706';
    case 'Tier 2': return '#dc2626'; 
    case 'Tier 3': return '#7c3aed';
    default: return '#6b7280';
  }
}

</script>

<template>
    <div class="background-layer"></div>
      
    <div class="featured-events-page main">
      <commonHeader />
      
      <section class="main-content">
        <!-- Conference Selector -->
        <aside class="conference-selector">
          <div class="selector-header">
            <h2>Featured Conferences</h2>
            <div class="stats">
              <span class="stat-item">{{ conferenceStats.totalConferences }} Conferences</span>
              <span class="stat-item">{{ conferenceStats.categories.length }} Categories</span>
            </div>
          </div>
          <div class="conference-list">
            <div 
              v-for="conf in featuredConferences" 
              :key="conf.id"
              :class="['conference-card', { active: selectedConference.id === conf.id }]"
              @click="selectConference(conf)"
            >
              <div class="card-logo">
                <img :src="conf.logo" :alt="conf.conferenceName" />
              </div>
              <div class="card-info">
                <div class="card-name">{{ conf.conferenceName }}</div>
                <div class="card-category">{{ conf.category }}</div>
                <div class="card-date">{{ conf.conferenceDate }}</div>
                <div class="card-tier" :style="{ color: getTierColor(conf.tier) }">{{ conf.tier }}</div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Conference Details -->
        <section class="conference-details">
          <header class="event-header">
            <div class="conference-header">
              <div class="logo">
                <img :src="selectedConference.logo" :alt="selectedConference.conferenceName" />
              </div>
              <div class="conference-info">
                <div class="conference-name">{{ selectedConference.conferenceName }}</div>
                <div class="conference-full-name">{{ selectedConference.conferenceFullName }}</div>
                <div class="conference-details">
                  <div class="detail-row">
                    <span class="detail-icon">📅</span>
                    <span class="detail-text">{{ selectedConference.conferenceDate }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-icon">📍</span>
                    <span class="detail-text">{{ selectedConference.location.city }}, {{ selectedConference.location.country }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-icon">🏢</span>
                    <span class="detail-text">{{ selectedConference.location.venue }}</span>
                  </div>
                  <div class="conference-links">
                    <a :href="selectedConference.websites.official" target="_blank" class="conf-link">
                      <span class="link-icon">🌐</span>
                      Official Website
                    </a>
                    <a :href="selectedConference.websites.committee" target="_blank" class="conf-link">
                      <span class="link-icon">👥</span>
                      Committee
                    </a>
                    <a :href="selectedConference.websites.registration" target="_blank" class="conf-link">
                      <span class="link-icon">📝</span>
                      Registration
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Conference Statistics & Info -->
            <!-- <div class="conference-stats">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">⭐</div>
                  <div class="stat-value">{{ selectedConference.tier }}</div>
                  <div class="stat-label">Conference Tier</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">📊</div>
                  <div class="stat-value">{{ selectedConference.acceptanceRate }}</div>
                  <div class="stat-label">Acceptance Rate</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">👥</div>
                  <div class="stat-value">{{ selectedConference.expectedAttendees }}</div>
                  <div class="stat-label">Expected Attendees</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">🏷️</div>
                  <div class="stat-value">{{ selectedConference.category }}</div>
                  <div class="stat-label">Research Area</div>
                </div>
              </div>
            </div> -->

            <!-- Conference Description -->
            <div class="conference-description">
              <h3>About This Conference</h3>
              <p>{{ selectedConference.description }}</p>
            </div>

            <!-- Research Topics -->
            <div class="research-topics">
              <h3>Key Research Topics</h3>
              <div class="topic-tags">
                <span v-for="topic in selectedConference.topics" :key="topic" class="topic-tag">
                  {{ topic }}
                </span>
              </div>
            </div>

            <!-- Important Dates -->
            <div class="important-dates">
              <h3>Important Dates</h3>
              <div class="dates-grid">
                <div class="date-item">
                  <div class="date-icon">📝</div>
                  <div class="date-info">
                    <div class="date-label">Submission Deadline</div>
                    <div class="date-value">{{ selectedConference.submissionDeadline }}</div>
                  </div>
                </div>
                <div class="date-item">
                  <div class="date-icon">📧</div>
                  <div class="date-info">
                    <div class="date-label">Notification Date</div>
                    <div class="date-value">{{ selectedConference.notificationDate }}</div>
                  </div>
                </div>
                <div class="date-item">
                  <div class="date-icon">🎯</div>
                  <div class="date-info">
                    <div class="date-label">Conference Dates</div>
                    <div class="date-value">{{ selectedConference.conferenceDate }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button @click="registerInterest(selectedConference.id)" class="interest-btn">
                <span class="btn-icon">💡</span>
                Add to Favourite
              </button>
              <a :href="selectedConference.websites.official" target="_blank" class="visit-btn">
                <span class="btn-icon">🔗</span>
                Visit Website
              </a>
              <a :href="selectedConference.websites.registration" target="_blank" class="register-btn">
                <span class="btn-icon">📝</span>
                Register Now
              </a>
            </div>
          </header>
        </section>
      </section>
    </div>
  </template>